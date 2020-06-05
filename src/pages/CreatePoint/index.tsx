import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import { Map, TileLayer, Marker } from 'react-leaflet'
import axios from 'axios'

import api from 'services/api'

import './styles.css'
import logo from 'assets/logo.svg'
import { LeafletMouseEvent } from 'leaflet'

interface Item {
  id: number;
  title: string;
  image_url: string;
}

interface IBGEUFResponse {
  sigla: string;
}

interface IBGECityResponse {
  nome: string;
}

const CreatePoint = () => {
  const history = useHistory()
  const [items, setItems] = useState<Item[]>([])
  const [ufs, setUfs] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [selectedUf, setSelectedUf] = useState('0')
  const [selectedCity, setSelectedCity] = useState('0')
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [initialPos, setInitialPos] = useState<[number, number]>([0, 0])
  const [selectedPos, setSelectedPos] = useState<[number, number]>([0, 0])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: ''
  })

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords

      setInitialPos([latitude, longitude])
    })
  }, [])

  useEffect(() => {
    api.get('items').then(response => setItems(response.data))
  }, [])

  useEffect(() => {
    const url = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados'
    axios.get<IBGEUFResponse[]>(url).then(response => {
      const ufAbbrevs = response.data.map(uf => uf.sigla)
      setUfs(ufAbbrevs)
    })
  }, [])

  useEffect(() => {
    api.get('items').then(response => setItems(response.data))
  }, [])

  useEffect(() => {
    if (selectedUf === '0') return

    const url = `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`
    axios.get<IBGECityResponse[]>(url).then(response => {
      const cityNames = response.data.map(uf => uf.nome)
      setCities(cityNames)
    })
  }, [selectedUf])

  const handleSelectUf = (e: ChangeEvent<HTMLSelectElement>) => {
    const uf = e.target.value

    setSelectedUf(uf)
  }

  const handleSelectCity = (e: ChangeEvent<HTMLSelectElement>) => {
    const city = e.target.value

    setSelectedCity(city)
  }

  const handleMapClick = (e: LeafletMouseEvent) => {
    setSelectedPos([e.latlng.lat, e.latlng.lng])
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    setFormData({ ...formData, [name]: value })
  }

  const handleSelectItem = (itemId: number) => {
    const alreadySelected = selectedItems.findIndex(item => item === itemId)

    if (alreadySelected >= 0) {
      const filteredItems = selectedItems.filter(item => item !== itemId)
      return setSelectedItems(filteredItems)
    }

    setSelectedItems([...selectedItems, itemId])
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const { name, email, whatsapp } = formData
    const [latitude, longitude] = selectedPos

    const data = {
      name,
      email,
      whatsapp,
      uf: selectedUf,
      city: selectedCity,
      latitude,
      longitude,
      items: selectedItems
    }

    api.post('/points', data)

    alert('Ponto de coleta criado!')
    history.push('/')
  }

  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Ecoleta" />

        <Link to="/">
          <FiArrowLeft />
          Voltar para Home
        </Link>
      </header>

      <form onSubmit={handleSubmit}>
        <h1>Cadastro de <br /> ponto de coleta</h1>

        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>

          <div className="field">
            <label htmlFor="name">Nome da entidade</label>
            <input
              type="text"
              name="name"
              id="name"
              onChange={handleInputChange}
            />
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="name">E-mail</label>
              <input
                type="email"
                name="email"
                id="email"
                onChange={handleInputChange}
              />
            </div>
            <div className="field">
              <label htmlFor="name">Whatsapp</label>
              <input
                type="text"
                name="whatsapp"
                id="whatsapp"
                onChange={handleInputChange}
              />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Endereço</h2>

            <span>Selecione o endereço no mapa</span>
          </legend>

          <Map center={initialPos} zoom={15} onClick={handleMapClick}>
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={selectedPos} />
          </Map>

          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado (UF)</label>
              <select
                name="uf"
                id="uf"
                value={selectedUf}
                onChange={handleSelectUf}
              >
                <option value="0">Selecione uma UF</option>

                {ufs.map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="city">Cidade</label>
              <select
                name="city"
                id="city"
                value={selectedCity}
                onChange={handleSelectCity}
              >
                <option value="0">Selecione uma cidade</option>

                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Ítems de coleta</h2>
          </legend>

          <ul className="items-grid">
            {items.map(item => (
              <li
                key={item.id}
                onClick={() => handleSelectItem(item.id)}
                className={selectedItems.includes(item.id) ? 'selected' : ''}
              >
                <img src={item.image_url} alt={item.title}/>
                <span>{item.title}</span>
              </li>
            ))}
          </ul>
        </fieldset>

        <button type="submit">
          Cadastrar ponto de coleta
        </button>
      </form>
    </div>
  )
}

export default CreatePoint
