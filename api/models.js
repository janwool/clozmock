import { getCollection } from './_lib/db.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const models = await getCollection('models')
    const { id } = req.query || {}

    if (id) {
      const model = await models.findOne({ id }, { projection: { _id: 0, createdAt: 0, updatedAt: 0 } })
      if (!model) {
        return res.status(404).json({ error: 'Model not found' })
      }
      return res.status(200).json(model)
    }

    const allModels = await models.find({}, { projection: { _id: 0, createdAt: 0, updatedAt: 0 } }).toArray()
    return res.status(200).json(allModels)
  } catch (error) {
    console.error('Models API error:', error)
    return res.status(500).json({ error: 'Failed to fetch models' })
  }
}
