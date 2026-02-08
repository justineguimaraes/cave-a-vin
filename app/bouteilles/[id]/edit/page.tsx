'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../src/lib/supabase'
import Link from 'next/link'

export default function EditBottlePage() {
  const params = useParams<{ id: string }>()
  const id = Number(params.id)
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [nom, setNom] = useState('')
  const [annee, setAnnee] = useState<number | ''>('')
  const [domaine, setDomaine] = useState('')
  const [typeVin, setTypeVin] = useState<'rouge' | 'blanc' | 'rosé' | ''>('')
  const [cepage, setCepage] = useState('')
  const [accords, setAccords] = useState('')
  const [tempsConservation, setTempsConservation] = useState<number | ''>('')

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from('bouteilles').select('*').eq('id', id).single()
      if (!error && data) {
        setNom(data.nom ?? '')
        setAnnee(data.annee ?? '')
        setDomaine(data.domaine ?? '')
        setTypeVin((data.type_vin ?? '') as any)
        setCepage(data.cepage ?? '')
        setAccords(data.accords ?? '')
        setTempsConservation(data.temps_conservation ?? '')
      }
      setLoading(false)
    }
    if (id) load()
  }, [id])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('bouteilles').update({
      nom,
      annee: annee === '' ? null : Number(annee),
      domaine: domaine || null,
      type_vin: typeVin || null,
      cepage: cepage || null,
      accords: accords || null,
      temps_conservation: tempsConservation === '' ? null : Number(tempsConservation),
    }).eq('id', id)
    setSaving(false)
    router.push('/') // retour à l’accueil
  }

  if (loading) return <div className="p-6">Chargement…</div>

  return (
    <main className="min-h-screen max-w-2xl mx-auto p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#6b2737]">Modifier la bouteille</h1>
        <Link href="/" className="text-sm text-[#6b2737] hover:underline">← Retour</Link>
      </div>

      <form onSubmit={save} className="bg-white/80 backdrop-blur p-5 rounded-xl ring-1 ring-rose-200 space-y-4">
        <div>
          <label className="block text-sm font-medium">Nom *</label>
          <input className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2" value={nom} onChange={e=>setNom(e.target.value)} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Année</label>
            <input type="number" className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2" value={annee} onChange={e=>setAnnee(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm font-medium">Domaine</label>
            <input className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2" value={domaine} onChange={e=>setDomaine(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium">Type</label>
            <select className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2" value={typeVin} onChange={e=>setTypeVin(e.target.value as any)}>
              <option value="">—</option>
              <option value="rouge">rouge</option>
              <option value="blanc">blanc</option>
              <option value="rosé">rosé</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Cépage</label>
            <input className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2" value={cepage} onChange={e=>setCepage(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Temps conservation (années)</label>
            <input type="number" className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2" value={tempsConservation} onChange={e=>setTempsConservation(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Accords</label>
          <input className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2" value={accords} onChange={e=>setAccords(e.target.value)} />
        </div>

        <div className="pt-2">
          <button disabled={saving} className="px-4 py-2 rounded-lg bg-[#7b2d26] text-white hover:opacity-90">
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </main>
  )
}