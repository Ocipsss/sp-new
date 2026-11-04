import { defineStore } from 'pinia'
import { operatorRepo } from '../db/repositories/operatorRepository.js'

async function hashPin(pin) {
  if (!pin) return ''
  const str = String(pin)
  if (/^[a-f0-9]{64}$/i.test(str)) return str.toLowerCase()
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(str)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } catch {
    return str
  }
}

export const useOperatorStore = defineStore('operator', {
  state: () => ({
    activeOperator: null,
    operators: []
  }),

  getters: {
    isLoggedIn: (state) => !!state.activeOperator,
    operatorName: (state) => state.activeOperator?.name || 'Kasir',
    operatorRole: (state) => state.activeOperator?.role || 'Kasir'
  },

  actions: {
    async loadOperators() {
      this.operators = await operatorRepo.getAll()
      return this.operators
    },

    async login(operatorId, pinInput) {
      if (this.operators.length === 0) {
        await this.loadOperators()
      }
      
      const target = this.operators.find(o => o.id === operatorId)

      if (!target) {
        throw new Error('Operator tidak ditemukan.')
      }

      if (target.pin) {
        const hashedInput = await hashPin(pinInput)
        const targetIsHashed = /^[a-f0-9]{64}$/i.test(target.pin)
        const isValid = targetIsHashed ? target.pin.toLowerCase() === hashedInput : target.pin === pinInput
        if (!isValid) {
          throw new Error('PIN yang Anda masukkan salah.')
        }
      }

      this.activeOperator = {
        id: target.id,
        name: target.name,
        role: target.role
      }

      return this.activeOperator
    },

    logout() {
      this.activeOperator = null
    }
  },

  persist: true
})