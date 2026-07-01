'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from 'react'
import { ImagePlus, Loader2, MapPin, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { sanitizeText, sanitizePrice } from '@/lib/sanitize'
import type { Product } from '@/components/profile/product-card'

export type Category = {
  id: string
  name: string
  icon: string | null
}

type NewListingModalProps = {
  userId: string
  categories: Category[]
  open: boolean
  onClose: () => void
  onSuccess: (product: Product) => void
}

type FormErrors = {
  title?: string
  category?: string
  condition?: string
  price?: string
  photos?: string
}

const CONDITION_OPTIONS = [
  { value: 'new', label: 'New with tags' },
  { value: 'like_new', label: 'Like new' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
]

const MAX_PHOTOS = 5
const MAX_PHOTO_SIZE = 5 * 1024 * 1024
const VALID_PHOTO_TYPES = ['image/jpeg', 'image/png']

export function NewListingModal({
  userId,
  categories,
  open,
  onClose,
  onSuccess,
}: NewListingModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [condition, setCondition] = useState('')
  const [price, setPrice] = useState('')
  const [location, setLocation] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ visible: boolean; fading: boolean }>({
    visible: false,
    fading: false,
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const toastTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const supabase = createClient()

  const previews = useMemo(
    () => photos.map((file) => URL.createObjectURL(file)),
    [photos]
  )

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [previews])

  useEffect(() => {
    if (!open) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !submitting) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, submitting, onClose])

  useEffect(() => {
    const timers = toastTimers.current
    return () => {
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [])

  function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return

    const incoming = Array.from(fileList)
    const validFiles: File[] = []
    let rejection: string | null = null

    for (const file of incoming) {
      if (!VALID_PHOTO_TYPES.includes(file.type)) {
        rejection = 'Only JPG or PNG images are allowed.'
        continue
      }
      if (file.size > MAX_PHOTO_SIZE) {
        rejection = 'Each photo must be 5MB or smaller.'
        continue
      }
      validFiles.push(file)
    }

    const available = MAX_PHOTOS - photos.length
    if (validFiles.length > available) {
      rejection = 'You can upload up to 5 photos.'
    }

    if (available > 0 && validFiles.length > 0) {
      setPhotos((prev) => [...prev, ...validFiles.slice(0, available)])
    }

    setErrors((prev) => ({ ...prev, photos: rejection ?? undefined }))
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    if (submitting) return
    addFiles(event.dataTransfer.files)
  }

  function resetForm() {
    setTitle('')
    setDescription('')
    setCategoryId('')
    setCondition('')
    setPrice('')
    setLocation('')
    setPhotos([])
    setErrors({})
    setSubmitError(null)
  }

  function handleClose() {
    if (submitting) return
    onClose()
  }

  function showSuccessToast() {
    setToast({ visible: true, fading: false })
    toastTimers.current.push(
      setTimeout(() => setToast((t) => ({ ...t, fading: true })), 2500),
      setTimeout(() => setToast({ visible: false, fading: false }), 3000)
    )
  }

  function validate(): boolean {
    const nextErrors: FormErrors = {}

    if (!title.trim()) {
      nextErrors.title = 'Title is required.'
    } else if (title.length > 100) {
      nextErrors.title = 'Title must be 100 characters or fewer.'
    }

    if (!categoryId) {
      nextErrors.category = 'Please select a category.'
    }

    if (!condition) {
      nextErrors.condition = 'Please select a condition.'
    }

    const numericPrice = Number(price)
    if (!price || Number.isNaN(numericPrice) || numericPrice <= 0) {
      nextErrors.price = 'Enter a price greater than 0.'
    }

    if (photos.length === 0) {
      nextErrors.photos = 'Add at least one photo.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)

    if (!validate()) return

    setSubmitting(true)

    try {
      const imageUrls: string[] = []

      for (let i = 0; i < photos.length; i++) {
        const file = photos[i]
        const extension = file.name.split('.').pop() || 'jpg'
        const path = `${userId}/${Date.now()}-${i}.${extension}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(path, file, { cacheControl: '3600' })

        if (uploadError) {
          throw new Error(uploadError.message)
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('product-images').getPublicUrl(path)

        imageUrls.push(publicUrl)
      }

      const { data: newProduct, error: insertError } = await supabase
        .from('products')
        .insert({
          seller_id: userId,
          category_id: categoryId,
          title: sanitizeText(title, 100),
          description: sanitizeText(description, 1000) || null,
          price: sanitizePrice(Number(price)),
          condition,
          location: sanitizeText(location, 200) || null,
          images: imageUrls,
        })
        .select('id, title, price, images, status, is_sold')
        .single()

      if (insertError) {
        console.error(
          `Failed to insert product: message="${insertError.message}" code="${insertError.code}" details="${insertError.details}" hint="${insertError.hint}"`
        )
        throw new Error(insertError.message)
      }

      onSuccess(newProduct as Product)
      resetForm()
      onClose()
      showSuccessToast()
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 sm:p-4"
          onClick={handleClose}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-listing-title"
            onClick={(event) => event.stopPropagation()}
            className="relative flex h-full w-full flex-col bg-white sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-2xl sm:shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
              <h2 id="new-listing-title" className="text-lg font-bold text-[#2D2E32]">
                New listing
              </h2>
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                aria-label="Close"
                className="text-[#9CA3AF] transition-colors hover:text-[#2D2E32] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 space-y-4 overflow-y-auto px-6 py-4"
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-[#2D2E32]">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  maxLength={100}
                  disabled={submitting}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setTitle(event.target.value)
                  }
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#2D2E32] outline-none focus:border-[#F36D21] disabled:opacity-60"
                />
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-[#C0392B]">{errors.title}</span>
                  <span className="text-xs text-[#9CA3AF]">{title.length} / 100</span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#2D2E32]">
                  Description
                </label>
                <textarea
                  value={description}
                  maxLength={1000}
                  rows={4}
                  disabled={submitting}
                  placeholder="Describe the item's condition, size, material..."
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                    setDescription(event.target.value)
                  }
                  className="w-full resize-none rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#2D2E32] outline-none placeholder:text-[#9CA3AF] focus:border-[#F36D21] disabled:opacity-60"
                />
                <div className="mt-1 text-right text-xs text-[#9CA3AF]">
                  {description.length} / 1000
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#2D2E32]">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    disabled={submitting}
                    onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                      setCategoryId(event.target.value)
                    }
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#2D2E32] outline-none focus:border-[#F36D21] disabled:opacity-60"
                  >
                    <option value="">Select</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon ? `${category.icon} ` : ''}
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-xs text-[#C0392B]">{errors.category}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[#2D2E32]">
                    Condition
                  </label>
                  <select
                    value={condition}
                    disabled={submitting}
                    onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                      setCondition(event.target.value)
                    }
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#2D2E32] outline-none focus:border-[#F36D21] disabled:opacity-60"
                  >
                    <option value="">Select</option>
                    {CONDITION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.condition && (
                    <p className="mt-1 text-xs text-[#C0392B]">{errors.condition}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#2D2E32]">
                  Price
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#6B7280]">
                    MMK
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={price}
                    disabled={submitting}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setPrice(event.target.value)
                    }
                    className="w-full rounded-lg border border-[#E5E7EB] py-2 pl-14 pr-3 text-sm text-[#2D2E32] outline-none focus:border-[#F36D21] disabled:opacity-60"
                  />
                </div>
                {errors.price && (
                  <p className="mt-1 text-xs text-[#C0392B]">{errors.price}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#2D2E32]">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" aria-hidden="true" />
                    Location
                  </span>
                </label>
                <input
                  type="text"
                  value={location}
                  disabled={submitting}
                  placeholder="e.g. Yangon, Mandalay, Mawlamyine"
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setLocation(event.target.value)
                  }
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#2D2E32] outline-none placeholder:text-[#9CA3AF] focus:border-[#F36D21] disabled:opacity-60"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#2D2E32]">
                  Photos
                </label>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => !submitting && fileInputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (submitting) return
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      fileInputRef.current?.click()
                    }
                  }}
                  onDragOver={(event) => {
                    event.preventDefault()
                    if (!submitting) setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={cn(
                    'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors',
                    isDragging
                      ? 'border-[#F36D21] bg-[#FEF3E2]'
                      : 'border-[#E5E7EB] hover:border-[#F36D21]/50',
                    submitting && 'pointer-events-none opacity-60'
                  )}
                >
                  <ImagePlus className="size-6 text-[#9CA3AF]" aria-hidden="true" />
                  <p className="text-sm text-[#6B7280]">
                    <span className="font-medium text-[#F36D21]">Click to upload</span>{' '}
                    or drag and drop
                  </p>
                  <p className="text-xs text-[#9CA3AF]">
                    JPG or PNG, up to 5 photos, 5MB each
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    addFiles(event.target.files)
                    event.target.value = ''
                  }}
                  className="hidden"
                />
                {errors.photos && (
                  <p className="mt-1 text-xs text-[#C0392B]">{errors.photos}</p>
                )}

                {previews.length > 0 && (
                  <div className="mt-3 flex gap-3 overflow-x-auto">
                    {previews.map((src, index) => (
                      <div key={src} className="relative shrink-0">
                        <div className="size-20 overflow-hidden rounded-lg bg-[#F3F4F6]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt="" className="size-full object-cover" />
                        </div>
                        {index === 0 && (
                          <span className="absolute bottom-1 left-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                            Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          disabled={submitting}
                          aria-label="Remove photo"
                          className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-white text-[#6B7280] shadow-sm ring-1 ring-[#E5E7EB] hover:text-[#C0392B] disabled:opacity-60"
                        >
                          <X className="size-3" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {submitError && (
                <div className="rounded-lg bg-[#FDEDEC] px-3 py-2 text-xs text-[#C0392B]">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-[#F36D21] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#E0631D] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Posting...
                  </span>
                ) : (
                  'Post listing'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {toast.visible && (
        <div
          aria-live="polite"
          className={cn(
            'fixed bottom-6 right-6 z-[60] rounded-xl bg-[#1F9254] px-4 py-3 text-sm font-medium text-white shadow-lg transition-opacity duration-500',
            toast.fading ? 'opacity-0' : 'opacity-100'
          )}
        >
          Listing submitted — pending review
        </div>
      )}
    </>
  )
}
