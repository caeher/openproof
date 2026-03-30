'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import type { DocumentMetadata } from '@/types'

interface DocumentMetadataFormProps {
  onMetadataChange: (metadata: DocumentMetadata) => void
  initialMetadata?: DocumentMetadata
}

export function DocumentMetadataForm({
  onMetadataChange,
  initialMetadata,
}: DocumentMetadataFormProps) {
  const [description, setDescription] = useState(initialMetadata?.description || '')
  const [tags, setTags] = useState<string[]>(initialMetadata?.tags || [])
  const [tagInput, setTagInput] = useState('')

  const handleDescriptionChange = (value: string) => {
    setDescription(value)
    onMetadataChange({ ...initialMetadata, description: value, tags })
  }

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      const newTags = [...tags, trimmedTag]
      setTags(newTags)
      setTagInput('')
      onMetadataChange({ ...initialMetadata, description, tags: newTags })
    }
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove)
    setTags(newTags)
    onMetadataChange({ ...initialMetadata, description, tags: newTags })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="description">
          Descripción <span className="text-muted-foreground">(opcional)</span>
        </FieldLabel>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="Añade una descripción para identificar este documento..."
          className="min-h-[80px] resize-none"
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">
          {description.length}/500 caracteres
        </p>
      </Field>

      <Field>
        <FieldLabel htmlFor="tags">
          Etiquetas <span className="text-muted-foreground">(opcional)</span>
        </FieldLabel>
        <div className="flex gap-2">
          <Input
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Añadir etiqueta..."
            className="flex-1"
            disabled={tags.length >= 5}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={addTag}
            disabled={!tagInput.trim() || tags.length >= 5}
          >
            Añadir
          </Button>
        </div>
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="pl-2 pr-1 py-1 gap-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="p-0.5 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-3 h-3" />
                  <span className="sr-only">Eliminar {tag}</span>
                </button>
              </Badge>
            ))}
          </div>
        )}
        
        <p className="text-xs text-muted-foreground">
          {tags.length}/5 etiquetas
        </p>
      </Field>
    </FieldGroup>
  )
}
