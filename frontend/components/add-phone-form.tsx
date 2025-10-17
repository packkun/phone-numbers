"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Plus } from "lucide-react"

export function AddPhoneForm() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const password = sessionStorage.getItem("admin_password")
      const formData = new FormData()
      formData.append("phone_number", phoneNumber)
      formData.append("name", "")
      formData.append("password", password || "")

      const response = await fetch(`${backendUrl}/api/v1/phones`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Номер добавлен",
        })
        setPhoneNumber("")
      } else {
        const error = await response.json()
        toast({
          title: "Ошибка",
          description: error.detail || "Не удалось добавить номер",
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
        <CardTitle>Добавить номер</CardTitle>
        <CardDescription>Добавьте новый телефонный номер в систему</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Номер телефона</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+79001234567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>


          <Button type="submit" className="w-full gap-2" disabled={isLoading}>
            <Plus className="h-4 w-4" />
            {isLoading ? "Добавление..." : "Добавить номер"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
