import express from 'express'
import { ggcc_community_online } from './ggcc_community_online.js'

const app= express()

app.use(express.json())

// Routes
app.get('/extractor', async (req, res) => {
  const community= req.query.community
  const department= req.query.department
  const tower= req.query.tower
  const user= req.query.user
  const password= req.query.password
  const total= await ggcc_community_online(community,department,tower,user,password)
  const {invoice_amount }= total.data[0]
  if (invoice_amount == "Error al cargar página"){
    res.status(500).send(JSON.stringify(total))
  }else {
    res.status(200).send(JSON.stringify(total));
  }
})  



// PORT
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server hosted on: ${PORT}`)
})