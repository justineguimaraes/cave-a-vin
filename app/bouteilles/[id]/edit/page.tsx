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

  // 🆕 état pour la date d'achat, format 'YYYY-MM-DD' attendu par <input type="date">
  const [dateAchat, setDateAchat] = useState<string>('')
  const [prix, setPrix] = useState<number | ''>('')

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('bouteilles')
        .select('*')
        .eq('id', id)
        .single()

      if (!error && data) {
        setNom(data.nom ?? '')
        setAnnee(data.annee ?? '')
        setDomaine(data.domaine ?? '')
        setTypeVin((data.type_vin ?? '') as any)
        setCepage(data.cepage ?? '')
        setAccords(data.accords ?? '')
        setTempsConservation(data.temps_conservation ?? '')

        // 🆕 si date_achat est un type date en Postgres, Supabase renvoie généralement 'YYYY-MM-DD'
        setDateAchat(data.date_achat ?? '')
        setPrix(data.prix ?? '')
      }
      setLoading(false)
    }
    if (id) load()
  }, [id])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await supabase
      .from('bouteilles')
      .update({
        nom,
        annee: annee === '' ? null : Number(annee),
        domaine: domaine || null,
        type_vin: typeVin || null,
        cepage: cepage || null,
        accords: accords || null,
        temps_conservation: tempsConservation === '' ? null : Number(tempsConservation),

        // 🆕 on enregistre la date (string 'YYYY-MM-DD' ou null)
        date_achat: dateAchat || null,
        prix: prix === '' ? null : Number(prix),
      })
      .eq('id', id)

    setSaving(false)
    router.push('/') // retour à l’accueil
  }

  if (loading) return <div className="p-6 text-rose-50 bg-[#0f0b0c] min-h-screen">Chargement…</div>

  return (
    <main className="min-h-screen max-w-2xl mx-auto p-6 bg-[#0f0b0c] text-rose-50">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-rose-100">Modifier la bouteille</h1>
        <Link href="/" className="text-sm text-rose-200 hover:underline/50">← Retour</Link>
      </div>

      <form
        onSubmit={save}
        className="bg-white/5 backdrop-blur p-5 rounded-xl ring-1 ring-white/10 space-y-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
      >
        <div>
          <label className="block text-sm font-medium text-rose-200">Nom *</label>
          <input
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/50
                       focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-400/40"
            value={nom}
            onChange={e => setNom(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-rose-200">Année</label>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/50
                         focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-400/40"
              value={annee}
              onChange={e => setAnnee(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-rose-200">Domaine</label>
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/50
                         focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-400/40"
              value={domaine}
              onChange={e => setDomaine(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-rose-200">Type</label>
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white
                         focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-400/40"
              value={typeVin}
              onChange={e => setTypeVin(e.target.value as any)}
            >
              <option value="" className="bg-[#0f0b0c] text-white">—</option>
              <option value="rouge" className="bg-[#0f0b0c] text-white">rouge</option>
              <option value="blanc" className="bg-[#0f0b0c] text-white">blanc</option>
              <option value="rosé" className="bg-[#0f0b0c] text-white">rosé</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-rose-200">Cépage</label>
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/50
                         focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-400/40"
              value={cepage}
              onChange={e => setCepage(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-rose-200">Temps conservation (années)</label>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/50
                         focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-400/40"
              value={tempsConservation}
              onChange={e => setTempsConservation(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
        </div>

        {/* 🆕 Champ Date d'achat */}
        <div>
          <label className="block text-sm font-medium text-rose-200">Date d’achat</label>
          <input
            type="date"
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/50
                       focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-400/40"
            value={dateAchat}
            onChange={e => setDateAchat(e.target.value)}
          />
        </div>
        <div>  
          <label className="block text-sm font-medium text-rose-200">Prix (€)</label>  
          <input    
            type="number"    
            step="0.01"    
            min="0"    
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/50               
                      focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-400/40"    
            value={prix}    
            onChange={e => setPrix(e.target.value === '' ? '' : Number(e.target.value))}    
            placeholder="Ex. : 24.90"  
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-rose-200">Accords</label>
          <input
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/50
                       focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-400/40"
            value={accords}
            onChange={e => setAccords(e.target.value)}
          />
        </div>

        <div className="pt-2">
          <button
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#7b2d26] text-white hover:opacity-95 disabled:opacity-60
                       focus:outline-none focus:ring-2 focus:ring-rose-500/50"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </main>
  )
}