'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'
import { ImagePlus, Loader2, MapPin, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { sanitizeText, sanitizePrice } from '@/lib/sanitize'
import { createListing } from '@/app/products/actions'
import { formatPrice } from '@/lib/format-price'
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
  description?: string
  category?: string
  condition?: string
  price?: string
  photos?: string
}

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
  const t = useTranslations('listing')
  const tProduct = useTranslations('product')
  const tCommon = useTranslations('common')
  const CONDITION_OPTIONS = [
    { value: 'new', label: t('conditionNewWithTags') },
    { value: 'like_new', label: tProduct('conditionLikeNew') },
    { value: 'good', label: tProduct('conditionGood') },
    { value: 'fair', label: tProduct('conditionFair') },
  ]
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
        rejection = t('onlyJpgPng')
        continue
      }
      if (file.size > MAX_PHOTO_SIZE) {
        rejection = t('photoTooLarge')
        continue
      }
      validFiles.push(file)
    }

    const available = MAX_PHOTOS - photos.length
    if (validFiles.length > available) {
      rejection = t('maxPhotos')
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

    const trimmedTitle = title.trim()
    if (!trimmedTitle || trimmedTitle.length < 3) {
      nextErrors.title = t('titleTooShort')
    } else if (trimmedTitle.length > 100) {
      nextErrors.title = t('titleTooLong')
    }

    const trimmedDesc = description.trim()
    if (!trimmedDesc || trimmedDesc.length < 10) {
      nextErrors.description = t('descriptionTooShort')
    } else if (trimmedDesc.length > 2000) {
      nextErrors.description = t('descriptionTooLong')
    }

    if (!categoryId) {
      nextErrors.category = t('selectCategory')
    }

    if (!condition) {
      nextErrors.condition = t('selectCondition')
    }

    const numericPrice = Number(price)
    if (!price || Number.isNaN(numericPrice) || numericPrice <= 0) {
      nextErrors.price = t('priceMustBePositive')
    } else if (numericPrice > 999_999_999) {
      nextErrors.price = t('priceExceedsMax')
    }

    if (photos.length === 0) {
      nextErrors.photos = t('addAtLeastOnePhoto')
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit() {
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

      // Server action — handles validation + rate limiting + DB insert
      const result = await createListing({
        categoryId,
        title: sanitizeText(title, 100),
        description: sanitizeText(description, 2000) || null,
        price: sanitizePrice(Number(price)),
        condition,
        location: sanitizeText(location, 100) || null,
        images: imageUrls,
      })

      if ('error' in result) {
        setSubmitError(result.error)
        return
      }

      onSuccess(result as Product)
      resetForm()
      onClose()
      showSuccessToast()
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : tCommon('somethingWentWrong')
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md sm:p-4"
          onClick={handleClose}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-listing-title"
            onClick={(event) => event.stopPropagation()}
            className="relative flex h-dvh w-full flex-col rounded-t-3xl border border-white/60 bg-white/90 backdrop-blur-2xl backdrop-saturate-150 sm:h-auto sm:max-h-[90dvh] sm:max-w-lg sm:rounded-2xl sm:shadow-[0_16px_48px_rgba(0,0,0,0.12)]"
          >
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
              <h2 id="new-listing-title" className="text-lg font-bold text-[#2D2E32]">
                {t('newListingTitle')}
              </h2>
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                aria-label={tCommon('close')}
                className="text-[#9CA3AF] transition-colors hover:text-[#2D2E32] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <form
              id="new-listing-form"
              onSubmit={(e) => { e.preventDefault(); void handleSubmit() }}
              className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4"
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-[#2D2E32]">
                  {t('titleLabel')}
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
                  {t('descriptionLabel')}
                </label>
                <textarea
                  value={description}
                  maxLength={2000}
                  rows={4}
                  disabled={submitting}
                  placeholder={t('descriptionPlaceholder')}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                    setDescription(event.target.value)
                  }
                  className="w-full resize-none rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#2D2E32] outline-none placeholder:text-[#9CA3AF] focus:border-[#F36D21] disabled:opacity-60"
                />
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-[#C0392B]">{errors.description}</span>
                  <span className="text-xs text-[#9CA3AF]">{description.length} / 2000</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#2D2E32]">
                    {t('categoryLabel')}
                  </label>
                  <select
                    value={categoryId}
                    disabled={submitting}
                    onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                      setCategoryId(event.target.value)
                    }
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#2D2E32] outline-none focus:border-[#F36D21] disabled:opacity-60"
                  >
                    <option value="">{t('selectPlaceholder')}</option>
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
                    {tProduct('condition')}
                  </label>
                  <select
                    value={condition}
                    disabled={submitting}
                    onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                      setCondition(event.target.value)
                    }
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#2D2E32] outline-none focus:border-[#F36D21] disabled:opacity-60"
                  >
                    <option value="">{t('selectPlaceholder')}</option>
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
                  {t('priceLabel')}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#6B7280]">
                    MMK
                  </span>
                  <input
  type="text"
  inputMode="numeric"
  pattern="[0-9]*"
  value={price}
  disabled={submitting}
  placeholder="0"
  onChange={(event: ChangeEvent<HTMLInputElement>) => {
    // Only allow digits, no letters, no decimals, no e/+/-
    const raw = event.target.value.replace(/[^0-9]/g, '')
    // Remove leading zeros
    const cleaned = raw.replace(/^0+(\d)/, '$1')
    setPrice(cleaned)
  }}
  className="w-full rounded-lg border border-[#E5E7EB] py-2 pl-14 pr-3 text-sm text-[#2D2E32] outline-none focus:border-[#F36D21] disabled:opacity-60"
/>
                </div>
                <div className="mt-1 flex items-center justify-between">
  <span className="text-xs text-[#C0392B]">{errors.price}</span>
  {price && !errors.price && (
    <span className="text-xs text-[#6B7280]">
      = {formatPrice(Number(price))}
    </span>
  )}
</div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#2D2E32]">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" aria-hidden="true" />
                    {t('locationLabel')}
                  </span>
                </label>
                <input
                  type="text"
                  value={location}
                  maxLength={100}
                  disabled={submitting}
                  placeholder={t('locationPlaceholder')}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setLocation(event.target.value)
                  }
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#2D2E32] outline-none placeholder:text-[#9CA3AF] focus:border-[#F36D21] disabled:opacity-60"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#2D2E32]">
                  {t('photosLabel')}
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
                    <span className="font-medium text-[#F36D21]">{t('clickToUpload')}</span>{' '}
                    {t('orDragAndDrop')}
                  </p>
                  <p className="text-xs text-[#9CA3AF]">
                    {t('photoRequirements')}
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
                            {t('cover')}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          disabled={submitting}
                          aria-label={t('removePhoto')}
                          className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-white text-[#6B7280] shadow-sm ring-1 ring-[#E5E7EB] hover:text-[#C0392B] disabled:opacity-60"
                        >
                          <X className="size-3" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </form>

            {/* Fixed footer — always visible, never scrolls off-screen */}
            <div
              className="shrink-0 border-t border-[#E5E7EB] px-6 pt-3"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
            >
              {submitError && (
                <div className="mb-3 rounded-lg bg-[#FDEDEC] px-3 py-2 text-xs text-[#C0392B]">
                  {submitError}
                </div>
              )}
              <button
                type="submit"
                form="new-listing-form"
                disabled={submitting}
                className="w-full rounded-lg bg-[#F36D21] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#E0631D] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    {t('posting')}
                  </span>
                ) : (
                  t('postListing')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.visible && (
        <div
          aria-live="polite"
          className={cn(
            'fixed bottom-6 right-6 z-60 rounded-xl bg-[#1F9254] px-4 py-3 text-sm font-medium text-white shadow-lg transition-opacity duration-500',
            toast.fading ? 'opacity-0' : 'opacity-100'
          )}
        >
          {t('listingSubmitted')}
        </div>
      )}
    </>
  )
}
