"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PhoneList } from "@/components/phone-list"
import { AddPhoneForm } from "@/components/add-phone-form"
import { BulkAddForm } from "@/components/bulk-add-form"
import { FileUploadForm } from "@/components/file-upload-form"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Phone } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const password = sessionStorage.getItem("admin_password")
    if (!password) {
      router.push("/")
    } else {
      setIsAuthenticated(true)
    }
  }, [router])

  const handleLogout = () => {
    sessionStorage.removeItem("admin_password")
    router.push("/")
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Управление номерами</h1>
              <p className="text-sm text-muted-foreground">Админ-панель</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2 bg-transparent">
            <LogOut className="h-4 w-4" />
            Выйти
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="list" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="list">Список номеров</TabsTrigger>
            <TabsTrigger value="add">Добавить номер</TabsTrigger>
            <TabsTrigger value="bulk">Массовое добавление</TabsTrigger>
            <TabsTrigger value="upload">Загрузить файл</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <PhoneList />
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <AddPhoneForm />
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4">
            <BulkAddForm />
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <FileUploadForm />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
