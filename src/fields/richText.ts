import {
  BlockquoteFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineCodeFeature,
  LinkFeature,
  UploadFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import type { RichTextField } from 'payload'

export const richTextEditor = () =>
  lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
      BlockquoteFeature(),
      HorizontalRuleFeature(),
      InlineCodeFeature(),
      LinkFeature({ enabledCollections: ['media'] }),
      UploadFeature({
        collections: {
          media: {
            fields: [
              {
                name: 'caption',
                type: 'text',
                admin: { placeholder: 'Image caption (optional)' },
              },
              {
                name: 'size',
                type: 'select',
                options: [
                  { label: 'Thumbnail (400×300)', value: 'thumbnail' },
                  { label: 'Card (768×512)', value: 'card' },
                  { label: 'Hero (1920×1080)', value: 'hero' },
                ],
                defaultValue: 'card',
              },
            ],
          },
        },
      }),
    ],
  })

export const richTextField = (name: string, label?: string): RichTextField => ({
  name,
  type: 'richText',
  label: label ?? name.charAt(0).toUpperCase() + name.slice(1),
  editor: richTextEditor(),
})
