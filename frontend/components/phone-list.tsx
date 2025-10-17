"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { EditPhoneDialog } from "@/components/edit-phone-dialog"
import { Search, Trash2, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Phone {
  id: number
  phone_number: string
  prefix: string
  created_at: string
}

type SortField = 'phone_number' | 'prefix' | 'created_at'
type SortDirection = 'asc' | 'desc' | null

export function PhoneList() {
  const [phones, setPhones] = useState<Phone[]>([])
  const [filteredPhones, setFilteredPhones] = useState<Phone[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [prefixFilter, setPrefixFilter] = useState("")
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  const fetchPhones = async () => {
    setIsLoading(true)
    try {
      const password = sessionStorage.getItem("admin_password")
      const url = new URL(`${backendUrl}/api/v1/phones`)

      if (password) {
        url.searchParams.append('password', password)
      }
      
      const response = await fetch(url.toString())

      if (response.ok) {
        const data = await response.json()
        setPhones(data.items || [])
        setFilteredPhones(data.items || [])
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить номера",
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

  useEffect(() => {
    fetchPhones()
  }, [])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortDirection(null)
        setSortField(null)
      } else {
        setSortDirection('asc')
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />
    if (sortDirection === 'asc') return <ArrowUp className="h-4 w-4" />
    if (sortDirection === 'desc') return <ArrowDown className="h-4 w-4" />
    return <ArrowUpDown className="h-4 w-4" />
  }

  const getUniquePrefixes = () => {
    const prefixes = [...new Set(phones.map(phone => phone.prefix))]
    return prefixes.sort()
  }

  useEffect(() => {
    let filtered = phones

    // Фильтр по поиску
    if (searchQuery) {
      filtered = filtered.filter((phone) => 
        phone.phone_number.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Фильтр по префиксу
    if (prefixFilter) {
      filtered = filtered.filter((phone) => phone.prefix === prefixFilter)
    }

    // Сортировка
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = a[sortField]
        let bValue = b[sortField]

        if (sortField === 'created_at') {
          aValue = new Date(aValue).getTime()
          bValue = new Date(bValue).getTime()
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }

    setFilteredPhones(filtered)
  }, [searchQuery, prefixFilter, sortField, sortDirection, phones])

  const handleDelete = async (id: number) => {
    try {
      const password = sessionStorage.getItem("admin_password")
      const formData = new FormData()
      formData.append("password", password || "")

      const response = await fetch(`${backendUrl}/api/v1/phones/${id}`, {
        method: "DELETE",
        body: formData,
      })

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Номер удален",
        })
        fetchPhones()
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось удалить номер",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Ошибка подключения к серверу",
        variant: "destructive",
      })
    }
  }


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Список номеров</CardTitle>
            <CardDescription>Всего номеров: {filteredPhones.length}</CardDescription>
          </div>
          <Button onClick={fetchPhones} variant="outline" size="icon" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по номеру..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={prefixFilter} 
              onChange={(e) => setPrefixFilter(e.target.value)}
              className="w-[180px] px-3 py-2 border rounded-md bg-background text-foreground"
            >
              <option value="">Все префиксы</option>
              {getUniquePrefixes().map((prefix) => (
                <option key={prefix} value={prefix}>
                  {prefix}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('phone_number')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Номер телефона
                    {getSortIcon('phone_number')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('prefix')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Префикс
                    {getSortIcon('prefix')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('created_at')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Дата создания
                    {getSortIcon('created_at')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Загрузка...
                  </TableCell>
                </TableRow>
              ) : filteredPhones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Номера не найдены
                  </TableCell>
                </TableRow>
              ) : (
                filteredPhones.map((phone) => (
                  <TableRow key={phone.id}>
                    <TableCell className="font-mono">{phone.id}</TableCell>
                    <TableCell className="font-mono">{phone.phone_number}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
                        {phone.prefix}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(phone.created_at).toLocaleString("ru-RU")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <EditPhoneDialog phone={phone} onSuccess={fetchPhones} />
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(phone.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
