import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Save } from "lucide-react";

export default function Settings() {
  const [theme, setTheme] = useState("dark");
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  return (
    <div className="max-w-2xl space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-muted border-border">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="tools">Tool Integration</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Display Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm mb-3 block">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark (Default)</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="auto">Auto (System)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm mb-3 block">Default View</Label>
                <Select defaultValue="agent-flow">
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dashboard">Dashboard</SelectItem>
                    <SelectItem value="agent-flow">Agent & Flow</SelectItem>
                    <SelectItem value="analysis">Analysis & Debug</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm mb-3 block">Default Project</Label>
                <Select defaultValue="cpu_core_v2">
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpu_core_v2">CPU_Core_v2</SelectItem>
                    <SelectItem value="mem_ctrl_a">Memory_Controller_A</SelectItem>
                    <SelectItem value="gpu_core">GPU_Core</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Behavior</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Auto-save Results</Label>
                  <p className="text-xs text-muted-foreground mt-1">Automatically save run results</p>
                </div>
                <Switch checked={autoSave} onCheckedChange={setAutoSave} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Confirm Before Stop</Label>
                  <p className="text-xs text-muted-foreground mt-1">Ask for confirmation when stopping agent runs</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Show Advanced Options</Label>
                  <p className="text-xs text-muted-foreground mt-1">Display expert-level configuration options</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tool Integration */}
        <TabsContent value="tools" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>EDA Tool Configuration</CardTitle>
              <CardDescription>Configure paths and settings for external tools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm mb-2 block">Synthesis Tool (Yosys)</Label>
                <Input
                  placeholder="/usr/local/bin/yosys"
                  className="bg-input border-border text-sm"
                  defaultValue="/usr/local/bin/yosys"
                />
              </div>

              <div>
                <Label className="text-sm mb-2 block">Place & Route (OpenROAD)</Label>
                <Input
                  placeholder="/usr/local/bin/openroad"
                  className="bg-input border-border text-sm"
                  defaultValue="/usr/local/bin/openroad"
                />
              </div>

              <div>
                <Label className="text-sm mb-2 block">Simulation Tool (Verilator)</Label>
                <Input
                  placeholder="/usr/local/bin/verilator"
                  className="bg-input border-border text-sm"
                  defaultValue="/usr/local/bin/verilator"
                />
              </div>

              <div>
                <Label className="text-sm mb-2 block">Waveform Viewer (GTKWave)</Label>
                <Input
                  placeholder="/usr/local/bin/gtkwave"
                  className="bg-input border-border text-sm"
                  defaultValue="/usr/local/bin/gtkwave"
                />
              </div>

              <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                <Save className="w-4 h-4 mr-2" />
                Save Tool Configuration
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>API Integration</CardTitle>
              <CardDescription>Connect to external services and APIs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm mb-2 block">Cadence API Key</Label>
                <Input
                  type="password"
                  placeholder="Enter your Cadence API key"
                  className="bg-input border-border text-sm"
                />
              </div>

              <div>
                <Label className="text-sm mb-2 block">Cloud Compute Endpoint</Label>
                <Input
                  placeholder="https://api.example.com"
                  className="bg-input border-border text-sm"
                />
              </div>

              <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                <Save className="w-4 h-4 mr-2" />
                Save API Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Enable Notifications</Label>
                  <p className="text-xs text-muted-foreground mt-1">Receive alerts for important events</p>
                </div>
                <Switch checked={notifications} onCheckedChange={setNotifications} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Run Completion</Label>
                  <p className="text-xs text-muted-foreground mt-1">Alert when agent run finishes</p>
                </div>
                <Switch defaultChecked disabled={!notifications} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Timing Violations</Label>
                  <p className="text-xs text-muted-foreground mt-1">Alert on critical timing issues</p>
                </div>
                <Switch defaultChecked disabled={!notifications} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Coverage Milestones</Label>
                  <p className="text-xs text-muted-foreground mt-1">Alert when coverage reaches 75%, 90%, 99%</p>
                </div>
                <Switch defaultChecked disabled={!notifications} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Resource Warnings</Label>
                  <p className="text-xs text-muted-foreground mt-1">Alert when resources are running low</p>
                </div>
                <Switch defaultChecked disabled={!notifications} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Notification Channels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Email Notifications</Label>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">In-App Notifications</Label>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Slack Integration</Label>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
