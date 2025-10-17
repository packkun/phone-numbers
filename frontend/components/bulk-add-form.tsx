"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Upload } from "lucide-react"

export function BulkAddForm() {
  const [phoneNumbers, setPhoneNumbers] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const password = sessionStorage.getItem("admin_password")
      const numbers = phoneNumbers
        .split("\n")
        .map((n) => n.trim())
        .filter((n) => n.length > 0)

      const formData = new FormData()
      formData.append("numbers", numbers)
      formData.append("password", password || "")

      const response = await fetch(`${backendUrl}/api/v1/phones/bulk`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Успешно",
          description: `Добавлено номеров: ${result.added}, Пропущено: ${result.skipped}`,
        })
        setPhoneNumbers("")
      } else {
        const error = await response.json()
        toast({
          title: "Ошибка",
          description: error.detail || "Не удалось добавить номера",
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
        <CardTitle>Массовое добавление</CardTitle>
        <CardDescription>Добавьте несколько номеров одновременно (по одному на строку)</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phones">Номера телефонов</Label>
            <Textarea
              id="phones"
              placeholder="+79001234567&#10;+79001234568&#10;+79001234569"
              value={phoneNumbers}
              onChange={(e) => setPhoneNumbers(e.target.value)}
              rows={10}
              required
              disabled={isLoading}
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground">Введите номера по одному на строку</p>
          </div>

          <Button type="submit" className="w-full gap-2" disabled={isLoading}>
            <Upload className="h-4 w-4" />
            {isLoading ? "Добавление..." : "Добавить номера"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
