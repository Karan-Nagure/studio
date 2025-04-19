"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface BulletData {
  bullet_id: string;
  bounding_box: [number, number, number, number];
  position: [number, number];
  speed_kmh: number;
  direction: string;
}

export default function Home() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [bulletData, setBulletData] = useState<BulletData[]>([]);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.5);
  const [iouThreshold, setIouThreshold] = useState<number>(0.5);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({video: true});
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.error('Error accessing camera:', err);
        setHasCameraPermission(false);
        setError('Camera Access Denied: Please enable camera permissions in your browser settings to use this app.');
      }
    };

    getCameraPermission();
  }, []);


  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
    }
  };

  const handleProcessVideo = useCallback(async () => {
    if (!videoFile) {
      setError("Please upload a video first.");
      return;
    }

    setProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append("video", videoFile);
    formData.append("confidence_threshold", confidenceThreshold.toString());
    formData.append("iou_threshold", iouThreshold.toString());

    try {
      const response = await fetch("/api/process_video", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setBulletData(data);

      if (videoRef.current) {
        videoRef.current.play();
      }
    } catch (e: any) {
      console.error("Error processing video:", e);
      setError(`Failed to process video: ${e.message}`);
    } finally {
      setProcessing(false);
    }
  }, [videoFile, confidenceThreshold, iouThreshold]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bullettrack-primary text-foreground p-4">
      <Card className="w-full max-w-4xl bg-bullettrack-secondary text-foreground shadow-md rounded-lg overflow-hidden">
        <CardHeader className="p-4">
          <CardTitle className="text-lg font-semibold">Bullet Detection</CardTitle>
          <CardDescription>Upload a video and track bullets in real-time.</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
        {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="mb-4">
            <Input type="file" accept="video/*" onChange={handleVideoUpload} className="mb-2" />
            {videoUrl && (
              <video ref={videoRef} src={videoUrl} controls className="w-full rounded-md shadow-md" />
            )}
          </div>
          <div className="mb-4">
            <Button
              onClick={handleProcessVideo}
              className="bg-bullettrack-accent text-foreground hover:bg-teal-700"
              disabled={processing}
            >
              {processing ? "Processing..." : "Process Video"}
            </Button>
          </div>
          <div className="mb-4">
            <h3 className="text-md font-semibold mb-2">Configuration</h3>
            <div className="flex items-center space-x-4">
              <div>
                <label htmlFor="confidence">Confidence Threshold:</label>
                <Slider
                  id="confidence"
                  defaultValue={[confidenceThreshold * 100]}
                  max={100}
                  step={1}
                  onValueChange={(value) => setConfidenceThreshold(value[0] / 100)}
                />
                <span>{confidenceThreshold.toFixed(2)}</span>
              </div>
              <div>
                <label htmlFor="iou">IOU Threshold:</label>
                <Slider
                  id="iou"
                  defaultValue={[iouThreshold * 100]}
                  max={100}
                  step={1}
                  onValueChange={(value) => setIouThreshold(value[0] / 100)}
                />
                <span>{iouThreshold.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-md font-semibold mb-2">Bullet Data</h3>
            <Table>
              <TableCaption>A list of detected bullets and their properties.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Bullet ID</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Speed (km/h)</TableHead>
                  <TableHead>Direction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bulletData.map((data) => (
                  <TableRow key={data.bullet_id}>
                    <TableCell className="font-medium">{data.bullet_id}</TableCell>
                    <TableCell>{`(${data.position[0]}, ${data.position[1]})`}</TableCell>
                    <TableCell>{data.speed_kmh}</TableCell>
                    <TableCell>{data.direction}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
}
