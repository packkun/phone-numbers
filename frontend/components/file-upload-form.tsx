"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Upload, FileText } from "lucide-react"

export function FileUploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setIsLoading(true)

    try {
      const password = sessionStorage.getItem("admin_password")
      const formData = new FormData()
      formData.append("file", file)
      formData.append("password", password || "")

      const response = await fetch(`${backendUrl}/api/v1/phones/upload`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Успешно",
          description: `Добавлено номеров: ${result.added}, Пропущено: ${result.skipped}`,
        })
        setFile(null)
        // Reset file input
        const fileInput = document.getElementById("file") as HTMLInputElement
        if (fileInput) fileInput.value = ""
      } else {
        const error = await response.json()
        toast({
          title: "Ошибка",
          description: error.detail || "Не удалось загрузить файл",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Ошибка подключения к серверу",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Загрузить файл</CardTitle>
        <CardDescription>Загрузите CSV или TXT файл с номерами телефонов</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Файл</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".csv,.txt"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
                disabled={isLoading}
                className="cursor-pointer"
              />
              {file && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {file.name}
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Поддерживаемые форматы: CSV, TXT (по одному номеру на строку)
            </p>
          </div>

          <Button type="submit" className="w-full gap-2" disabled={isLoading || !file}>
            <Upload className="h-4 w-4" />
            {isLoading ? "Загрузка..." : "Загрузить файл"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
