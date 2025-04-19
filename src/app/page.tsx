"use client";

import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

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

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
    }
  };

  const handleProcessVideo = useCallback(async () => {
    if (!videoFile) {
      alert("Please upload a video first.");
      return;
    }

    // Simulate processing the video and getting bullet data
    // Replace this with actual API call to your Flask backend
    const simulatedBulletData: BulletData[] = [
      {
        bullet_id: "bullet_1",
        bounding_box: [100, 100, 150, 150],
        position: [125, 125],
        speed_kmh: 150.0,
        direction: "Right",
      },
      {
        bullet_id: "bullet_2",
        bounding_box: [200, 200, 250, 250],
        position: [225, 225],
        speed_kmh: 180.0,
        direction: "Left",
      },
    ];

    setBulletData(simulatedBulletData);

    if (videoRef.current) {
      videoRef.current.play();
    }
  }, [videoFile]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bullettrack-primary text-foreground p-4">
      <Card className="w-full max-w-4xl bg-bullettrack-secondary text-foreground shadow-md rounded-lg overflow-hidden">
        <CardHeader className="p-4">
          <CardTitle className="text-lg font-semibold">Bullet Detection</CardTitle>
          <CardDescription>Upload a video and track bullets in real-time.</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="mb-4">
            <Input type="file" accept="video/*" onChange={handleVideoUpload} className="mb-2" />
            {videoUrl && (
              <video ref={videoRef} src={videoUrl} controls className="w-full rounded-md shadow-md" />
            )}
          </div>
          <div className="mb-4">
            <Button onClick={handleProcessVideo} className="bg-bullettrack-accent text-foreground hover:bg-teal-700">
              Process Video
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
