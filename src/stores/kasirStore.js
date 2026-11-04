// src/stores/kasirStore.js
import { defineStore } from 'pinia'

export const useKasirStore = defineStore('kasir', {
  state: () => ({
    cart: [],
    selectedMember: null,
    paymentMethod: 'CASH',
    bayarNominal: 0,
    pendingCarts: [],
    editingTransactionId: null // ID transaksi yang sedang diedit
  }),
  actions: {
    // Muat transaksi lama ke keranjang kasir
    loadTransactionForEdit(transaction) {
      this.clearCart()
      this.editingTransactionId = transaction.id
      this.paymentMethod = transaction.paymentMethod || 'CASH'
      
      // Isi keranjang dengan item dari nota lama
      this.cart = transaction.items.map(item => ({
        id: item.productId || item.id,
        cartItemId: item.id || crypto.randomUUID(),
        name: item.productName || item.name,
        price_sell: item.price,
        cartQty: item.qty,
        isServed: !!item.serviceId
      }))
    },

    addToCart(product, options = {}) {
      const { packageInfo = null, isServed = false, serviceFee = 0, customName = '' } = options

      const itemId = packageInfo 
        ? `${product.id}_pkg_${packageInfo.id}`
        : isServed 
          ? `${product.id}_served` 
          : product.id

      const finalName = customName || (isServed ? `Seduh ${product.name}` : product.name)
      const basePrice = packageInfo ? packageInfo.price_sell : product.price_sell
      const finalPrice = basePrice + (isServed ? serviceFee : 0)

      const idx = this.cart.findIndex(c => c.cartItemId === itemId)

      if (idx > -1) {
        this.cart[idx].cartQty++
        const item = this.cart.splice(idx, 1)[0]
        this.cart.unshift(item)
      } else {
        this.cart.unshift({
          ...product,
          cartItemId: itemId,
          name: finalName,
          originalName: product.name,
          price_sell: finalPrice,
          cartQty: 1,
          packageInfo,
          isServed,
          serviceFee
        })
      }
    },
    inc(index) {
      if (this.cart[index]) this.cart[index].cartQty++
    },
    dec(index) {
      if (this.cart[index]) {
        this.cart[index].cartQty--
        if (this.cart[index].cartQty <= 0) {
          this.cart.splice(index, 1)
        }
      }
    },
    clearCart() {
      this.cart = []
      this.selectedMember = null
      this.bayarNominal = 0
      this.paymentMethod = 'CASH'
      this.editingTransactionId = null
    },
    holdCurrentCart(label = '') {
      if (this.cart.length === 0) return
      this.pendingCarts.push({
        id: crypto.randomUUID(),
        createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        label: label || this.selectedMember?.name || `Transaksi #${this.pendingCarts.length + 1}`,
        cart: [...this.cart],
        selectedMember: this.selectedMember,
        paymentMethod: this.paymentMethod
      })
      this.clearCart()
    },
    resumeCart(pendingId) {
      const idx = this.pendingCarts.findIndex(p => p.id === pendingId)
      if (idx > -1) {
        const item = this.pendingCarts.splice(idx, 1)[0]
        this.cart = item.cart
        this.selectedMember = item.selectedMember
        this.paymentMethod = item.paymentMethod || 'CASH'
      }
    },
    removePending(pendingId) {
      this.pendingCarts = this.pendingCarts.filter(p => p.id !== pendingId)
    }
  },
  persist: true
})
