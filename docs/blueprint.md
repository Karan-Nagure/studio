# **App Name**: BulletTrack

## Core Features:

- Video Upload: Allow users to upload video files for bullet detection.
- Video Processing: Process the uploaded video using the provided Python script to detect and track bullets.
- Real-time Display: Display the processed video with bullet detection results in real-time on the website.
- Data Display: Show a table or list of bullet data including bounding box coordinates, position, speed, and direction.
- Configuration: Allow users to set parameters such as the confidence threshold and the IOU threshold.

## Style Guidelines:

- Primary color: Dark gray (#333) for a professional look.
- Secondary color: Light gray (#f0f0f0) for content backgrounds.
- Accent color: Teal (#008080) for interactive elements and highlights.
- Clean, sans-serif fonts for readability.
- Full-screen video display with data panels on the side.
- Simple, clear icons for controls and data visualization.

## Original User Request:
create a full stack website for my project. the project idea is real time bullet detection. create a web page that upload the video and detects the bullet in the video and show it on the website page. for that use react as frontend and python flask as backend. use the following code for detection. import cv2
import numpy as np
import json
from ultralytics import YOLO

# Load YOLO model
model = YOLO("test/weights4/best.pt")

# Dictionary to store bullet tracking data
bullet_data = {}

# Function to create a Kalman filter
def create_kalman():
    kf = cv2.KalmanFilter(4, 2)
    kf.transitionMatrix = np.array([[1, 0, 1, 0], 
                                    [0, 1, 0, 1], 
                                    [0, 0, 1, 0], 
                                    [0, 0, 0, 1]], np.float32)
    kf.measurementMatrix = np.array([[1, 0, 0, 0], 
                                     [0, 1, 0, 0]], np.float32)
    kf.processNoiseCov = np.eye(4, dtype=np.float32) * 0.03
    kf.measurementNoiseCov = np.eye(2, dtype=np.float32) * 0.1
    return kf

# Tracking variables
kalman_filters = {}  # Stores Kalman filters per bullet ID
trajectories = {}  # Stores trajectory points per bullet ID
previous_positions = {}  # Stores previous positions for speed calculation
disappeared_frames = {}  # Keeps track of disappeared bullets
disappearance_threshold = 10  # Frames before considering bullet gone
fps = 30  # Adjust based on video FPS

# Open video file
cap = cv2.VideoCapture("v11.mp4")

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    # Detect bullets using YOLO
    results = model(frame)
    detected_bullet_ids = set()

    for result in results:
        boxes = result.boxes.xyxy.cpu().numpy()  # Extract bounding boxes
        for i, box in enumerate(boxes):
            x1, y1, x2, y2 = map(int, box)
            cx, cy = (x1 + x2) // 2, (y1 + y2) // 2  # Bullet center

            # Assign a unique ID for each bullet
            bullet_id = f"bullet_{i}"

            if bullet_id not in kalman_filters:
                kalman_filters[bullet_id] = create_kalman()
                trajectories[bullet_id] = []
                previous_positions[bullet_id] = None
                disappeared_frames[bullet_id] = 0

            # Apply Kalman Filter
            measured = np.array([[np.float32(cx)], [np.float32(cy)]])
            kalman_filters[bullet_id].correct(measured)
            predicted = kalman_filters[bullet_id].predict()
            px, py = int(predicted[0]), int(predicted[1])

            # Store trajectory points
            trajectories[bullet_id].append((px, py))
            
            # Calculate Speed
            if previous_positions[bullet_id] is not None:
                prev_x, prev_y = previous_positions[bullet_id]
                distance = np.sqrt((px - prev_x) ** 2 + (py - prev_y) ** 2)
                speed = distance * fps  # Pixels per second
                speed_kmh = speed * 0.02  # Approximate km/h

                # Calculate Direction
                angle = np.arctan2(py - prev_y, px - prev_x) * (180 / np.pi)
                if -45 <= angle < 45:
                    direction = "Right"
                elif 45 <= angle < 135:
                    direction = "Up"
                elif -135 <= angle < -45:
                    direction = "Down"
                else:
                    direction = "Left"
            else:
                speed_kmh = 0
                direction = "Unknown"

            previous_positions[bullet_id] = (px, py)
            detected_bullet_ids.add(bullet_id)

            # Save bullet data
            bullet_data[bullet_id] = {
                "bounding_box": [x1, y1, x2, y2],
                "position": [px, py],
                "speed_kmh": round(speed_kmh, 2),
                "direction": direction
            }

            # Draw bounding box
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.circle(frame, (px, py), 4, (0, 0, 255), -1)



    # Handle disappearing bullets
    for bullet_id in list(disappeared_frames.keys()):
        if bullet_id not in detected_bullet_ids:
            disappeared_frames[bullet_id] += 1
            if disappeared_frames[bullet_id] > disappearance_threshold:
                del kalman_filters[bullet_id]
                del trajectories[bullet_id]
                del previous_positions[bullet_id]
                del disappeared_frames[bullet_id]
                del bullet_data[bullet_id]  # Remove from JSON data too

    # Show frame
    frame_resized = cv2.resize(frame, (800, 700))
    cv2.imshow("Bullet Tracking", frame_resized)

    # Save data to JSON file every few frames
    if len(bullet_data) > 0:
        with open("bullet_tracking_data.json", "w") as json_file:
            json.dump(bullet_data, json_file, indent=4)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
  
  