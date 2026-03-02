import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Users,
  UserPlus,
  Lock,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Info,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { useImportsData } from "@/hooks/useImportsData";
import { Card as UICard, CardContent as UICardContent } from "@/components/ui/card";

const teamMembers = [
  { id: "1", name: "Amina Warsame", email: "amina.warsame@oxfam.org", role: "admin", lastActive: "2026-02-24", status: "active" },
  { id: "2", name: "Hassan Mohamed", email: "hassan.mohamed@oxfam.org", role: "ops", lastActive: "2026-02-24", status: "active" },
  { id: "3", name: "Leyla Abdi", email: "leyla.abdi@oxfam.org", role: "analyst", lastActive: "2026-02-23", status: "active" },
  { id: "4", name: "Brian Muriuki", email: "brian.muriuki@oxfam.org", role: "field", lastActive: "2026-02-22", status: "active" },
  { id: "5", name: "Maryan Ali", email: "maryan.ali@oxfam.org", role: "field", lastActive: "2026-02-18", status: "inactive" },
];

const rolePermissions = {
  admin: {
    label: "Platform Admin",
    color: "bg-destructive/10 text-destructive border-destructive/20",
    permissions: ["View all data", "Edit all data", "Manage users", "Export data", "Delete records"],
  },
  ops: {
    label: "Operations Lead",
    color: "bg-primary/10 text-primary border-primary/20",
    permissions: ["View all data", "Edit assigned corridors", "Approve deployments", "Export data"],
  },
  analyst: {
    label: "Data Analyst",
    color: "bg-muted text-muted-foreground border-muted",
    permissions: ["View all data", "Edit scoring weights", "Publish reports"],
  },
  field: {
    label: "Field Team",
    color: "bg-muted text-muted-foreground border-muted",
    permissions: ["View assigned sites", "Update arrivals", "Record community alerts"],
  },
};

const Admin = () => {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadPhase, setUploadPhase] = useState<string | null>(null);
  const importsQuery = useImportsData();

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
      const form = new FormData();
      form.append("file", file);
      return await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${apiUrl}/api/sites/import`);
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.timeout = 600000; // 10 minutes for large XLSX
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(pct);
            setUploadPhase("Uploading file");
          }
        };
        xhr.upload.onload = () => {
          // upload finished, now server is processing
            setUploadPhase("Processing on server");
            setUploadProgress(null);
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const json = JSON.parse(xhr.responseText);
              resolve(json);
            } catch (e) {
              reject(new Error("Invalid server response"));
            }
          } else {
            reject(new Error(xhr.responseText || "Import failed"));
          }
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.ontimeout = () => reject(new Error("Request timed out"));
        xhr.send(form);
      });
    },
    onSuccess: (data: any) => {
      // Queue-based flow: backend returns { jobId } immediately. If a synchronous
      // import count ever comes back, use it; otherwise show the queued message.
      queryClient.invalidateQueries({ queryKey: ["imports"] });
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      const description = typeof data?.imported === "number"
        ? `Imported ${data.imported} rows and refreshed dashboard.`
        : data?.jobId
          ? `Import queued (job ${data.jobId}). Processing will update the dashboard automatically.`
          : "Import queued. Processing will update the dashboard automatically.";
      toast({ title: "Import queued", description });
      setUploadProgress(null);
      setUploadPhase(null);
      importsQuery.refetch();
    },
    onError: (err: any) => {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
      setUploadProgress(null);
      setUploadPhase(null);
      importsQuery.refetch();
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Admin & Access Control</h1>
        <p className="page-description">
          Manage Oxfam Novib team access, roles, and data privacy for the Nabad Mobile Hub
        </p>
      </div>

      <Tabs defaultValue="team" className="space-y-6">
        <TabsList>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            Team Members
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="h-4 w-4" />
            Roles & Permissions
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2">
            <Lock className="h-4 w-4" />
            Data Privacy
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <Upload className="h-4 w-4" />
            Data Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{teamMembers.length}</p>
                    <p className="text-sm text-muted-foreground">Total Members</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-success/10">
                    <CheckCircle className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {teamMembers.filter((m) => m.status === "active").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-destructive/10">
                    <Shield className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {teamMembers.filter((m) => m.role === "admin").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Administrators</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage who has access to the dashboard</CardDescription>
              </div>
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>Send an invitation to join the dashboard</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input placeholder="name@oxfam.org" type="email" />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select defaultValue="field">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Platform Admin</SelectItem>
                          <SelectItem value="ops">Operations Lead</SelectItem>
                          <SelectItem value="analyst">Data Analyst</SelectItem>
                          <SelectItem value="field">Field Team</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setInviteDialogOpen(false)}>Send Invite</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>{member.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("capitalize", rolePermissions[member.role].color)}>
                          {rolePermissions[member.role].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.status === "active" ? "success" : "outline"}>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{member.lastActive}</TableCell>
                      <TableCell className="flex items-center gap-2">
                        <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Definitions</CardTitle>
              <CardDescription>Who can change weights, publish alerts, and green-light deployments</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(rolePermissions).map(([key, role]) => (
                <Card key={key} className="border">
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold">{role.label}</p>
                        <Badge className={role.color}>{key}</Badge>
                      </div>
                      <Switch defaultChecked={key !== "field"} />
                    </div>
                    <div className="space-y-2">
                      {role.permissions.map((perm) => (
                        <div key={perm} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span>{perm}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Data Privacy & Audit
              </CardTitle>
              <CardDescription>Controls for PII, field redactions, and donor audit readiness</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Redact beneficiary PII</p>
                  <p className="text-sm text-muted-foreground">Masks names/contacts in exports and screenshots.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Geo-blur sensitive sites</p>
                  <p className="text-sm text-muted-foreground">Offsets GPS for protection risks (CDMC alerts).</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Require 2FA for deployments</p>
                  <p className="text-sm text-muted-foreground">Deployment approvals must be verified.</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Audit log retention (days)</p>
                  <p className="text-sm text-muted-foreground">Keep decision logs for donor review.</p>
                </div>
                <Input defaultValue={90} className="w-24" />
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <div>
                  <p className="font-semibold">Note</p>
                  <p>PII redaction must be enabled before exporting any field-level datasets.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
                <Info className="h-4 w-4 mt-0.5" />
                <div>
                  <p className="font-semibold">Data precedence</p>
                  <p>CDMC alerts override IOM “empty” flags for 48 hours pending verification.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Latest XLSX
              </CardTitle>
              <CardDescription>
                Upload the IOM_DTM_ETT_SOM_Tracker_sinceFeb2025_w49.xlsx (or newer). Imported data will be used across all tabs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select .xlsx file</Label>
                <Input
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-muted-foreground">
                  Expected structure: IOM ETT displacement (14d arrivals), sites, GPS, households. The ingest job will regenerate
                  `src/data/nabad.generated.ts`.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => {
                    if (!selectedFile) {
                      toast({ title: "No file selected", description: "Choose an .xlsx file first." });
                      return;
                    }
                    importMutation.mutate(selectedFile);
                  }}
                  disabled={importMutation.isPending}
                >
                  {importMutation.isPending ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {uploadPhase === "Processing on server"
                        ? "Processing..."
                        : uploadProgress !== null
                        ? `${uploadProgress}%`
                        : "Importing..."}
                    </span>
                  ) : (
                    "Import and refresh"
                  )}
                </Button>
                {selectedFile && <Badge variant="outline">{selectedFile.name}</Badge>}
              </div>
              {importMutation.isPending && (
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>
                    {uploadPhase ?? "Uploading"}{" "}
                    {uploadPhase === "Processing on server"
                      ? ""
                      : uploadProgress !== null
                      ? `• ${uploadProgress}%`
                      : ""}
                  </span>
                </div>
              )}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
                Uploading will store all columns in the database and refresh the dashboard automatically.
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-sm font-semibold">Recent imports</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {importsQuery.data?.map((job) => (
                    <div key={job.id} className="flex items-center justify-between border rounded-md px-2 py-1">
                      <span className="truncate max-w-[180px]" title={job.filename}>{job.filename}</span>
                      <span className="flex items-center gap-2">
                        <Badge variant={job.status === "done" ? "secondary" : job.status === "failed" ? "destructive" : "outline"}>
                          {job.status}
                        </Badge>
                        {job.status === "pending" && <Loader2 className="h-3 w-3 animate-spin" />}
                      </span>
                    </div>
                  )) || <span>No imports yet.</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          <UICard>
            <UICardContent className="p-4 space-y-3">
              <p className="text-sm font-semibold">Recent imports</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                {importsQuery.data?.map((job) => (
                  <div key={job.id} className="flex items-center justify-between border rounded-md px-2 py-1">
                    <div className="flex flex-col max-w-[200px]">
                      <span className="truncate" title={job.filename}>{job.filename}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(job.createdAt).toLocaleString()}
                        {job.finishedAt ? ` • done ${new Date(job.finishedAt).toLocaleTimeString()}` : ""}
                      </span>
                      {job.message && <span className="text-[10px] text-destructive">{job.message}</span>}
                    </div>
                    <span className="flex items-center gap-2">
                      <Badge variant={
                        job.status === "done" ? "secondary" :
                        job.status === "failed" ? "destructive" : "outline"
                      }>
                        {job.status}
                      </Badge>
                      {job.status === "pending" && <Loader2 className="h-3 w-3 animate-spin" />}
                    </span>
                  </div>
                )) || <span>No imports yet.</span>}
              </div>
            </UICardContent>
          </UICard>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
