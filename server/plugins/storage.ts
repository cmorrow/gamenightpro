// Mounts the "db" storage. Local dev uses files in .data/db. Azure uses Table Storage
// (cents per month at 50 users). Swapping to Cosmos DB later only changes this file.
export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()
  if (config.storageDriver !== 'azure-storage-table') return

  const connectionString = config.azureStorageConnectionString
  const accountName = /AccountName=([^;]+)/i.exec(connectionString)?.[1]
  if (!accountName) throw new Error('NUXT_AZURE_STORAGE_CONNECTION_STRING is missing or has no AccountName')

  const { default: azureTableDriver } = await import('unstorage/drivers/azure-storage-table')
  useStorage().mount('db', azureTableDriver({
    accountName,
    connectionString,
    tableName: 'appdata',
  }))
})
