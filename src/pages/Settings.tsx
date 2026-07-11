import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useTheme } from "@/components/theme-provider"
import { useAuth } from "@/contexts/AuthContext"
import { authApi, UserProfile } from "@/lib/authAPI"
import { useToast } from "@/hooks/use-toast"
import { 
  User, 
  Bell, 
  Shield, 
  Palette,
  Save,
  Trash2,
  Key
} from "lucide-react"

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const { state, logout } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 프로필 정보 로드
  useEffect(() => {
    const loadProfile = async () => {
      if (!state.token) {
        setIsLoading(false)
        return
      }

      try {
        const profileData = await authApi.getProfile(state.token)
        setProfile(profileData)
      } catch (err: any) {
        toast({
          title: "프로필 로드 실패",
          description: err.message || "프로필 정보를 불러오는데 실패했습니다.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [state.token, toast])


  const handleDeleteAccount = async () => {
    if (!state.token) {
      toast({
        title: "오류",
        description: "인증 토큰이 없습니다. 다시 로그인해주세요.",
        variant: "destructive"
      })
      return
    }

    setIsDeleting(true)
    try {
      await authApi.deleteAccount(state.token)
      toast({
        title: "계정 삭제 완료",
        description: "계정이 성공적으로 삭제되었습니다.",
      })
      logout()
      navigate("/login")
    } catch (err: any) {
      toast({
        title: "계정 삭제 실패",
        description: err.message || "계정 삭제에 실패했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account preferences and application settings
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">프로필 정보를 불러오는 중...</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={profile?.email || ""}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">이메일은 변경할 수 없습니다.</p>
                    </div>

                    {profile && (
                      <div className="space-y-2">
                        <Label>가입일</Label>
                        <p className="text-sm text-muted-foreground">
                          {new Date(profile.created_at).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive deployment status updates via email
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Deployment Success</p>
                      <p className="text-sm text-muted-foreground">
                        Notify when deployments complete successfully
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Deployment Failures</p>
                      <p className="text-sm text-muted-foreground">
                        Notify when deployments fail
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Resource Alerts</p>
                      <p className="text-sm text-muted-foreground">
                        Notify when resource usage exceeds thresholds
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Weekly Reports</p>
                      <p className="text-sm text-muted-foreground">
                        Receive weekly deployment summary reports
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <Button variant="hero">
                  <Save className="mr-2 h-4 w-4" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Change Password</h3>
                    <div className="space-y-3">
                      <Input type="password" placeholder="Current password" />
                      <Input type="password" placeholder="New password" />
                      <Input type="password" placeholder="Confirm new password" />
                      <Button variant="outline">
                        Update Password
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      API Keys
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Manage API keys for external integrations
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <p className="font-medium font-mono">launcha_*****************************</p>
                          <p className="text-sm text-muted-foreground">Created 2 days ago</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button variant="outline">
                        Generate New Key
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-medium mb-2 text-destructive">Danger Zone</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                    </p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isDeleting}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          {isDeleting ? "삭제 중..." : "계정 삭제"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>정말 계정을 삭제하시겠습니까?</AlertDialogTitle>
                          <AlertDialogDescription>
                            이 작업은 되돌릴 수 없습니다. 계정과 모든 관련 데이터가 영구적으로 삭제됩니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteAccount}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            삭제
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Appearance Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-4">Theme</h3>
                  <div className="grid gap-3">
                    <div 
                      className={`p-4 border rounded-lg cursor-pointer transition-smooth ${
                        theme === "light" ? "border-primary bg-primary/5" : "border-border"
                      }`}
                      onClick={() => setTheme("light")}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-white border-2 border-gray-300"></div>
                        <div>
                          <p className="font-medium">Light</p>
                          <p className="text-sm text-muted-foreground">Clean and bright interface</p>
                        </div>
                      </div>
                    </div>

                    <div 
                      className={`p-4 border rounded-lg cursor-pointer transition-smooth ${
                        theme === "dark" ? "border-primary bg-primary/5" : "border-border"
                      }`}
                      onClick={() => setTheme("dark")}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-gray-800 border-2 border-gray-600"></div>
                        <div>
                          <p className="font-medium">Dark</p>
                          <p className="text-sm text-muted-foreground">Easy on the eyes in low light</p>
                        </div>
                      </div>
                    </div>

                    <div 
                      className={`p-4 border rounded-lg cursor-pointer transition-smooth ${
                        theme === "system" ? "border-primary bg-primary/5" : "border-border"
                      }`}
                      onClick={() => setTheme("system")}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-white to-gray-800 border-2 border-gray-400"></div>
                        <div>
                          <p className="font-medium">System</p>
                          <p className="text-sm text-muted-foreground">Follows your system preference</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Compact Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Reduce spacing and padding for more content
                    </p>
                  </div>
                  <Switch />
                </div>

                <Button variant="hero">
                  <Save className="mr-2 h-4 w-4" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

