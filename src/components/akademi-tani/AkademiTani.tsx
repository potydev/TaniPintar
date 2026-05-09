'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/lib/store'
import {
  GraduationCap,
  BookOpen,
  Star,
  Clock,
  ChevronRight,
  Lock,
  Play,
  PlusCircle,
  Pencil,
  Trash2,
  Save,
} from 'lucide-react'

type ModuleLesson = {
  title: string
  body: string
}

type ModuleItem = {
  id: string
  title: string
  description: string
  category: string
  level: string
  duration: number
  lessonsCount: number
  progress: number
  rating: number
  isPublished: boolean
  content: ModuleLesson[]
}

function parseModuleContent(raw: unknown): ModuleLesson[] {
  if (!Array.isArray(raw)) return []
  const out: ModuleLesson[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const title = typeof o.title === 'string' ? o.title.trim() : ''
    const body = typeof o.body === 'string' ? o.body : ''
    if (!title && !body) continue
    out.push({ title: title || 'Bagian', body })
  }
  return out
}

const levelColors: Record<string, string> = {
  pemula: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  menengah: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  lanjutan: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const categoryIcons: Record<string, string> = {
  Pertanian: '🌾',
  Bisnis: '💼',
  Ekonomi: '📊',
  Teknologi: '⚙️',
  Keuangan: '💰',
}

const difficultyOptions = ['pemula', 'menengah', 'lanjutan']
const categoryOptions = ['Pertanian', 'Bisnis', 'Ekonomi', 'Teknologi', 'Keuangan']

export function AkademiTani() {
  const { toast } = useToast()
  const userRole = useAppStore((s) => s.userRole)
  const isAdmin = (userRole ?? '').toLowerCase() === 'admin'
  const [modules, setModules] = React.useState<ModuleItem[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isCreating, setIsCreating] = React.useState(false)
  const [viewerModule, setViewerModule] = React.useState<ModuleItem | null>(null)
  const [contentEditMode, setContentEditMode] = React.useState(false)
  const [contentDraft, setContentDraft] = React.useState<ModuleLesson[]>([])
  const [isSavingContent, setIsSavingContent] = React.useState(false)
  const [form, setForm] = React.useState({
    title: '',
    description: '',
    category: 'Pertanian',
    difficulty: 'pemula',
    durationHours: '1',
    lessonsCount: '0',
    imageUrl: '',
    isPublished: true,
  })

  const loadModules = React.useCallback(async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('learning_modules')
        .select(
          'id,title,description,category,difficulty,duration_hours,lessons_count,is_published,content',
        )
        .order('created_at', { ascending: false })

      if (!isAdmin) {
        query = query.eq('is_published', true)
      }

      const { data, error } = await query
      if (error) {
        toast({
          title: 'Gagal memuat modul',
          description: error.message,
          variant: 'destructive',
        })
        return
      }

      const mapped: ModuleItem[] = (data ?? []).map((row) => {
        const sections = parseModuleContent(row.content)
        const lessonsCount =
          sections.length > 0 ? sections.length : (row.lessons_count ?? 0)
        return {
          id: row.id,
          title: row.title ?? 'Tanpa Judul',
          description: row.description ?? '',
          category: row.category ?? 'Pertanian',
          level: row.difficulty ?? 'pemula',
          duration: (row.duration_hours ?? 1) * 60,
          lessonsCount,
          progress: 0,
          rating: 4.8,
          isPublished: Boolean(row.is_published),
          content: sections,
        }
      })

      setModules(mapped)
    } finally {
      setIsLoading(false)
    }
  }, [toast, isAdmin])

  React.useEffect(() => {
    void loadModules()
  }, [loadModules])

  const renderStars = (rating: number) => {
    const full = Math.floor(rating)
    const hasHalf = rating - full >= 0.5
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${
              i < full
                ? 'fill-amber-400 text-amber-400'
                : i === full && hasHalf
                  ? 'fill-amber-400/50 text-amber-400'
                  : 'text-muted-foreground/30'
            }`}
          />
        ))}
        <span className="ml-1 text-xs text-muted-foreground">{rating.toFixed(1)}</span>
      </div>
    )
  }

  const createModule = async () => {
    const title = form.title.trim()
    if (!title) {
      toast({
        title: 'Judul wajib diisi',
        description: 'Silakan isi judul modul terlebih dahulu.',
        variant: 'destructive',
      })
      return
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      toast({
        title: 'Sesi habis',
        description: 'Silakan login ulang sebagai admin.',
        variant: 'destructive',
      })
      return
    }

    setIsCreating(true)
    try {
      const res = await fetch('/api/learning-modules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title,
          description: form.description,
          category: form.category,
          difficulty: form.difficulty,
          durationHours: Number(form.durationHours) || 1,
          lessonsCount: Number(form.lessonsCount) || 0,
          imageUrl: form.imageUrl,
          isPublished: form.isPublished,
        }),
      })

      const json = (await res.json().catch(() => ({}))) as {
        error?: string
      }

      if (!res.ok) {
        toast({
          title: `Gagal membuat modul (${res.status})`,
          description:
            json.error ||
            (res.status === 403
              ? 'Akun ini bukan admin.'
              : res.status === 401
                ? 'Sesi login tidak valid.'
                : 'Terjadi kesalahan.'),
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Modul berhasil dibuat',
        description: 'Data modul sudah dikirim ke Supabase.',
      })
      setForm({
        title: '',
        description: '',
        category: 'Pertanian',
        difficulty: 'pemula',
        durationHours: '1',
        lessonsCount: '0',
        imageUrl: '',
        isPublished: true,
      })
      await loadModules()
    } finally {
      setIsCreating(false)
    }
  }

  const openModuleViewer = (module: ModuleItem) => {
    setViewerModule(module)
    setContentDraft(module.content.map((c) => ({ ...c })))
    setContentEditMode(false)
  }

  const closeModuleViewer = (open: boolean) => {
    if (!open) {
      setViewerModule(null)
      setContentEditMode(false)
      setContentDraft([])
    }
  }

  const saveModuleContent = async () => {
    if (!viewerModule) return
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      toast({
        title: 'Sesi habis',
        description: 'Silakan login ulang sebagai admin.',
        variant: 'destructive',
      })
      return
    }

    setIsSavingContent(true)
    try {
      const res = await fetch(`/api/learning-modules/${viewerModule.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ content: contentDraft }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        toast({
          title: `Gagal menyimpan (${res.status})`,
          description:
            json.error ||
            (res.status === 403
              ? 'Akun ini bukan admin.'
              : res.status === 401
                ? 'Sesi login tidak valid.'
                : 'Terjadi kesalahan.'),
          variant: 'destructive',
        })
        return
      }

      const nextContent = contentDraft.map((c) => ({ ...c }))
      setModules((prev) =>
        prev.map((m) =>
          m.id === viewerModule.id
            ? { ...m, content: nextContent, lessonsCount: nextContent.length }
            : m,
        ),
      )
      setViewerModule((vm) =>
        vm && vm.id === viewerModule.id
          ? { ...vm, content: nextContent, lessonsCount: nextContent.length }
          : vm,
      )
      setContentEditMode(false)
      toast({ title: 'Konten disimpan', description: 'Materi modul telah diperbarui.' })
    } finally {
      setIsSavingContent(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">AkademiTani</h1>
            <p className="text-sm text-muted-foreground">Modul Belajar Pertanian dari Supabase</p>
          </div>
        </div>
        <Badge variant="outline" className="mt-2">
          SDG 4: Quality Education
        </Badge>
      </motion.div>

      {isAdmin && (
        <Card className="mb-6 border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <PlusCircle className="h-4 w-4 text-primary" />
              Buat Modul Baru
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="module-title">Judul Modul</Label>
                <Input
                  id="module-title"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Contoh: Dasar Hidroponik untuk Pemula"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="module-description">Deskripsi</Label>
                <Textarea
                  id="module-description"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  placeholder="Ringkasan materi modul..."
                />
              </div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tingkat</Label>
                <Select
                  value={form.difficulty}
                  onValueChange={(v) => setForm((p) => ({ ...p, difficulty: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {difficultyOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item.charAt(0).toUpperCase() + item.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="module-duration">Durasi (jam)</Label>
                <Input
                  id="module-duration"
                  type="number"
                  min={1}
                  value={form.durationHours}
                  onChange={(e) => setForm((p) => ({ ...p, durationHours: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="module-lessons">Jumlah Pelajaran</Label>
                <Input
                  id="module-lessons"
                  type="number"
                  min={0}
                  value={form.lessonsCount}
                  onChange={(e) => setForm((p) => ({ ...p, lessonsCount: e.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="module-image">URL Gambar (opsional)</Label>
                <Input
                  id="module-image"
                  value={form.imageUrl}
                  onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="sm:col-span-2 flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Publikasikan modul</p>
                  <p className="text-xs text-muted-foreground">Jika mati, modul menjadi draft (hanya admin)</p>
                </div>
                <Switch
                  checked={form.isPublished}
                  onCheckedChange={(checked) =>
                    setForm((p) => ({ ...p, isPublished: checked }))
                  }
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => void createModule()} disabled={isCreating} className="gap-2">
                {isCreating ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <PlusCircle className="h-4 w-4" />
                )}
                Simpan Modul
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator className="mb-6" />

      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Memuat modul...</div>
      ) : modules.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Belum ada modul{isAdmin ? '. Buat modul pertama Anda.' : ' yang dipublikasikan.'}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {modules.map((module, idx) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
            >
              <Card className="h-full border-border/50 transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        {categoryIcons[module.category] ?? '📚'} {module.category}
                      </Badge>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ${levelColors[module.level] ?? ''}`}
                      >
                        {module.level.charAt(0).toUpperCase() + module.level.slice(1)}
                      </span>
                      {!module.isPublished && isAdmin && (
                        <Badge variant="outline" className="text-[10px]">Draft</Badge>
                      )}
                    </div>
                    {module.progress > 0 ? (
                      <Badge
                        variant="default"
                        className="bg-emerald-600 text-[10px] hover:bg-emerald-600"
                      >
                        {module.progress}%
                      </Badge>
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground/40" />
                    )}
                  </div>
                  <CardTitle className="text-base mt-2 leading-snug">{module.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {module.description || 'Belum ada deskripsi modul.'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {module.duration} menit
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      {module.lessonsCount} pelajaran
                    </span>
                  </div>

                  <div>{renderStars(module.rating)}</div>

                  {module.progress > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progres</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          {module.progress}%
                        </span>
                      </div>
                      <Progress value={module.progress} className="h-2" />
                    </div>
                  )}

                  <Button
                    variant={module.progress > 0 ? 'default' : 'outline'}
                    className={`w-full gap-2 text-sm ${
                      module.progress > 0 ? 'bg-emerald-600 hover:bg-emerald-700' : ''
                    }`}
                    onClick={() => openModuleViewer(module)}
                  >
                    {module.progress > 0 ? (
                      <>
                        <Play className="h-3.5 w-3.5" />
                        Lanjutkan Belajar
                      </>
                    ) : (
                      <>
                        <BookOpen className="h-3.5 w-3.5" />
                        Buka Modul
                      </>
                    )}
                    <ChevronRight className="ml-auto h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={!!viewerModule} onOpenChange={closeModuleViewer}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="shrink-0 space-y-1 px-6 pt-6 pb-2 pr-14">
            <DialogTitle className="text-left leading-snug">
              {viewerModule?.title}
            </DialogTitle>
            {viewerModule && isAdmin && (
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  type="button"
                  size="sm"
                  variant={contentEditMode ? 'secondary' : 'outline'}
                  className="gap-1.5"
                  onClick={() => {
                    setContentEditMode(false)
                    setContentDraft(viewerModule.content.map((c) => ({ ...c })))
                  }}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Baca
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={contentEditMode ? 'default' : 'outline'}
                  className="gap-1.5"
                  onClick={() => setContentEditMode(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit konten
                </Button>
              </div>
            )}
          </DialogHeader>

          <ScrollArea className="h-[min(68vh,calc(90vh-10.5rem))] min-h-[200px] px-6">
            <div className="space-y-4 pb-4 pr-3">
              {!viewerModule ? null : contentEditMode && isAdmin ? (
                <div className="space-y-4">
                  {contentDraft.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Belum ada bagian. Tambahkan bagian materi di bawah.
                    </p>
                  )}
                  {contentDraft.map((lesson, idx) => (
                    <Card key={idx} className="border-border/60">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
                        <span className="text-xs font-medium text-muted-foreground">
                          Bagian {idx + 1}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() =>
                            setContentDraft((d) => d.filter((_, i) => i !== idx))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        <div className="space-y-1.5">
                          <Label htmlFor={`lesson-title-${idx}`}>Judul bagian</Label>
                          <Input
                            id={`lesson-title-${idx}`}
                            value={lesson.title}
                            onChange={(e) =>
                              setContentDraft((d) =>
                                d.map((x, i) =>
                                  i === idx ? { ...x, title: e.target.value } : x,
                                ),
                              )
                            }
                            placeholder="Contoh: Pengenalan lahan"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`lesson-body-${idx}`}>Isi materi</Label>
                          <Textarea
                            id={`lesson-body-${idx}`}
                            value={lesson.body}
                            onChange={(e) =>
                              setContentDraft((d) =>
                                d.map((x, i) =>
                                  i === idx ? { ...x, body: e.target.value } : x,
                                ),
                              )
                            }
                            rows={8}
                            placeholder="Tulis penjelasan, langkah, atau catatan untuk peserta..."
                            className="min-h-[140px] max-h-[min(48vh,380px)] resize-y overflow-y-auto"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5"
                    onClick={() =>
                      setContentDraft((d) => [...d, { title: '', body: '' }])
                    }
                  >
                    <PlusCircle className="h-4 w-4" />
                    Tambah bagian
                  </Button>
                </div>
              ) : viewerModule.content.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  {isAdmin
                    ? 'Belum ada materi di modul ini. Gunakan Edit konten untuk menambahkan.'
                    : 'Materi modul akan segera tersedia.'}
                </p>
              ) : (
                viewerModule.content.map((lesson, idx) => (
                  <div key={idx} className="space-y-2 border-b border-border/50 pb-4 last:border-0">
                    <h3 className="text-sm font-semibold text-foreground">
                      {idx + 1}. {lesson.title}
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {lesson.body || '—'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {contentEditMode && isAdmin && viewerModule && (
            <DialogFooter className="shrink-0 border-t border-border/60 px-6 py-4 sm:justify-end">
              <Button
                type="button"
                onClick={() => void saveModuleContent()}
                disabled={isSavingContent}
                className="gap-2"
              >
                {isSavingContent ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Simpan konten
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

