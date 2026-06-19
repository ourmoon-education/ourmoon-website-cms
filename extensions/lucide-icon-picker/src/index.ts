import { defineInterface } from '@directus/extensions-sdk'
import InterfaceComponent from './interface.vue'

export default defineInterface({
  id: 'lucide-icon-picker',
  name: 'Lucide Icon Picker',
  icon: 'category',
  description: 'Pick a Lucide icon by name',
  component: InterfaceComponent,
  options: null,
  types: ['string'],
})
