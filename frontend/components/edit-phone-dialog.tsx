"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Pencil } from "lucide-react"

interface Phone {
  id: number
  phone_number: string
  prefix: string
  created_at: string
}

interface EditPhoneDialogProps {
  phone: Phone
  onSuccess: () => void
}

export function EditPhoneDialog({ phone, onSuccess }: EditPhoneDialogProps) {
  const [open, setOpen] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState(phone.phone_number)
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

      const response = await fetch(`${backendUrl}/api/v1/phones/${phone.id}`, {
        method: "PUT",
        body: formData,
      })

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Номер обновлен",
        })
        setOpen(false)
        onSuccess()
      } else {
        const error = await response.json()
        toast({
          title: "Ошибка",
          description: error.detail || "Не удалось обновить номер",
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактировать номер</DialogTitle>
          <DialogDescription>Измените данные телефонного номера</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-phone">Номер телефона</Label>
            <Input
              id="edit-phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>


          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
