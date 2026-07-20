export default defineNuxtPlugin(() => {
  const { restoreSession } = useAuth()
  restoreSession()
})
