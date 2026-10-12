// In Azure, cover images go to Blob Storage (same Storage Account as the user table).
export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()
  if (config.storageDriver !== 'azure-storage-table') return

  const connectionString = config.azureStorageConnectionString
  const accountName = /AccountName=([^;]+)/i.exec(connectionString)?.[1]
  if (!accountName) return

  const { default: azureBlobDriver } = await import('unstorage/drivers/azure-storage-blob')
  useStorage().mount('mbfiles', azureBlobDriver({
    accountName,
    connectionString,
    containerName: 'music-bingo-images',
  }))
})
