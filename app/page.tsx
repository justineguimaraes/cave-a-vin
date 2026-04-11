'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../src/lib/supabase'

type Compartiment = {
  region_id: number
  region_nom: string
  pilier: number
  compartiment: number
  nb_non_bues: number
  prochaine_date_limite: string | null
  nb_rouge: number
  nb_blanc: number
  nb_rose: number
}

type Bouteille = {
  id: number
  nom: string
  annee: number | null
  domaine: string | null
  type_vin: string | null
  cepage: string | null
  accords: string | null
  date_limite: string | null
  region_id: number
  // 🆕 champs ajoutés
  date_achat?: string | null
  prix?: number | null
}

const typeColor = (t: string | null) => {
  if (t === 'rouge') return 'bg-[#7b2d26]'                           // bordeaux profond
  if (t === 'blanc') return 'bg-white border border-zinc-400'        // ✅ pastille blanche visible
  if (t === 'rosé' || t === 'rose') return 'bg-[#f2b6c1]'            // rosé
  return 'bg-zinc-500'
}

// Helpers d’affichage
const formatDateFR = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'

const formatPrixEUR = (v?: number | null) =>
  v == null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v)

// Liste de cépages courants (tu peux en enlever/ajouter)
export const CEPAGES_POPULAIRES = [
  'Chardonnay', 'Sauvignon Blanc', 'Riesling', 'Semillon',
  'Pinot Gris', 'Viognier', 'Chenin Blanc', 'Gewürztraminer', 'Albariño', 'Moscato',
  'Merlot', 'Cabernet Sauvignon', 'Syrah', 'Grenache', 'Malbec',
  'Pinot Noir', 'Sangiovese', 'Tempranillo', 'Nebbiolo', 'Zinfandel',
  'Gamay', 'Carignan', 'Mourvèdre', 'Cabernet Franc', 'Tannat',
  'Carmenère', 'Touriga Nacional'
];

export default function Cave() {
  const [comps, setComps] = useState<Compartiment[]>([])
  const [selectedRegion, setSelectedRegion] = useState<Compartiment | null>(null)
  const [bouteilles, setBouteilles] = useState<Bouteille[]>([])
  const [selectedBouteille, setSelectedBouteille] = useState<Bouteille | null>(null)
  const [loadingBottles, setLoadingBottles] = useState(false)

  // Modale d’ajout
  const [addForPillar, setAddForPillar] = useState<number | null>(null)
  const [addRegionId, setAddRegionId] = useState<number | null>(null)
  const [addNom, setAddNom] = useState('')
  const [addAnnee, setAddAnnee] = useState<number | ''>('')
  const [addDomaine, setAddDomaine] = useState('')
  const [addTypeVin, setAddTypeVin] = useState<'rouge' | 'blanc' | 'rosé' | ''>('')
  const [addCepage, setAddCepage] = useState('')
  const [addAccords, setAddAccords] = useState('')
  const [addTempsConservation, setAddTempsConservation] = useState<number | ''>('')
  const [addQuantite, setAddQuantite] = useState<number>(1)
  const [savingAdd, setSavingAdd] = useState(false)
  const [addCompartiment, setAddCompartiment] = useState<number>(1)
  const [addAnneeLimite, setAddAnneeLimite] = useState<number | ''>('')

  // 🆕 états pour Date d’achat + Prix
  const [addDateAchat, setAddDateAchat] = useState<string>('')      // ex. '2025-11-15'
  const [addPrix, setAddPrix] = useState<number | ''>('')           // ex. 24.90

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from('v_compartiments_enrichi').select('*')
      if (!error) setComps((data ?? []) as Compartiment[])
    }
    load()
  }, [])

  // ✅ Bloquer le scroll du fond quand une modale est ouverte (iPhone/Safari)
  useEffect(() => {
    const modalOpen = selectedRegion !== null || addForPillar !== null
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow

    if (modalOpen) {
      html.style.overflow = 'hidden'
      body.style.overflow = 'hidden'
    } else {
      html.style.overflow = ''
      body.style.overflow = ''
    }

    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
    }
  }, [selectedRegion, addForPillar])

  // Liste des piliers (1..10)
  const pillars = useMemo(() => Array.from({ length: 10 }, (_, i) => i + 1), [])

  // Compartiments groupés par pilier
  const compsByPillar = useMemo(() => {
    const map = new Map<number, Compartiment[]>()
    for (const c of comps) {
      if (!map.has(c.pilier)) map.set(c.pilier, [])
      map.get(c.pilier)!.push(c)
    }
    for (const p of pillars) {
      map.set(p, (map.get(p) ?? []).sort((a, b) => a.compartiment - b.compartiment))
    }
    return map
  }, [comps, pillars])

  const getRegionIdByPillarAndCompartiment = (pillar: number, compartiment: number): number | null => {
    const list = compsByPillar.get(pillar) ?? []
    const hit = list.find(x => x.compartiment === compartiment)
    return hit ? hit.region_id : null
  }

  const getRegionNameByPillarAndCompartiment = (pillar: number, compartiment: number): string | null => {
    const list = compsByPillar.get(pillar) ?? []
    const hit = list.find(x => x.compartiment === compartiment)
    return hit ? hit.region_nom : null
  }

  // Titre de pilier = concaténation des noms de régions de ce pilier (sans doublons)
  const pillarTitle = (p: number) => {
    const list = (compsByPillar.get(p) ?? []).map(c => c.region_nom).filter(Boolean)
    const uniq = Array.from(new Set(list))
    if (uniq.length === 0) return `Pilier ${p}`
    return uniq.join(' + ')
  }

  const openCompartiment = async (c: Compartiment) => {
    setSelectedRegion(c)
    setSelectedBouteille(null)
    setLoadingBottles(true)
    const { data } = await supabase
      .from('v_bouteilles_par_compartiment')
      .select('*')
      .eq('region_id', c.region_id)
      .order('date_limite', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })
    setBouteilles((data ?? []) as Bouteille[])
    setLoadingBottles(false)
  }

  // Bue = supprimer de la base
  const deleteAsDrunk = async (b: Bouteille) => {
    await supabase.from('bouteilles').delete().eq('id', b.id)
    // refresh
    if (selectedRegion) {
      const { data } = await supabase
        .from('v_bouteilles_par_compartiment').select('*')
        .eq('region_id', selectedRegion.region_id)
      setBouteilles((data ?? []) as Bouteille[])
    }
    const { data: compRefresh } = await supabase.from('v_compartiments').select('*')
    setComps((compRefresh ?? []) as Compartiment[])
    setSelectedBouteille(null)
  }

  // Ouvrir la modale d’ajout pour un pilier
  const openAddForPillar = (p: number) => {
    setAddForPillar(p)
    const regions = compsByPillar.get(p) ?? []
    // par défaut : prendre le plus petit numéro de compartiment dispo dans ce pilier
    const defaultCompart = regions.length > 0 ? regions.map(r => r.compartiment).sort((a, b) => a - b)[0] : 1
    setAddCompartiment(defaultCompart)

    const rid = getRegionIdByPillarAndCompartiment(p, defaultCompart)
    setAddRegionId(rid)

    setAddNom('')
    setAddAnnee('')
    setAddDomaine('')
    setAddTypeVin('')
    setAddCepage('')
    setAddAccords('')
    setAddTempsConservation('')
    setAddQuantite(1)
    setAddAnneeLimite('')

    // 🆕 reset des nouveaux champs
    setAddDateAchat('')
    setAddPrix('')
  }

  // Insert en “quantité” (plusieurs exemplaires)
  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addForPillar) return

    // Résoudre la région par pilier + numéro de compartiment
    const targetRegionId = getRegionIdByPillarAndCompartiment(addForPillar, addCompartiment)
    if (!targetRegionId) {
      alert('Ce numéro de compartiment n’existe pas pour ce pilier.')
      return
    }
    if (!addNom || addQuantite < 1) return

    // Calculs : date_limite et/ou temps_conservation
    const qte = Math.min(Math.max(addQuantite, 1), 48) // 1..48
    const dateLimite = addAnneeLimite !== '' ? `${addAnneeLimite}-12-31` : null

    // Si l’utilisateur a fourni année + année limite mais pas de temps_conservation,
    // on peut déduire temps_conservation = année_limite - année (min 0)
    let computedTemps: number | null = addTempsConservation === '' ? null : Number(addTempsConservation)
    if (computedTemps === null && addAnnee !== '' && addAnneeLimite !== '') {
      const diff = Number(addAnneeLimite) - Number(addAnnee)
      computedTemps = diff >= 0 ? diff : 0
    }

    const payload = Array.from({ length: qte }).map(() => ({
      nom: addNom,
      annee: addAnnee === '' ? null : Number(addAnnee),
      domaine: addDomaine || null,
      type_vin: addTypeVin || null,
      cepage: addCepage || null,
      accords: addAccords || null,
      temps_conservation: computedTemps,
      date_limite: dateLimite,        // ✅ appliquée si fournie
      region_id: targetRegionId,
      // 🆕 nouveaux champs
      date_achat: addDateAchat || null,
      prix: addPrix === '' ? null : Number(addPrix),
    }))

    setSavingAdd(true)
    const { error } = await supabase.from('bouteilles').insert(payload)
    setSavingAdd(false)
    if (!error) {
      // refresh compteurs
      const { data: compRefresh } = await supabase.from('v_compartiments').select('*')
      setComps((compRefresh ?? []) as any)

      // si la modale de ce compartiment est ouverte, refresh la liste
      if (selectedRegion && selectedRegion.region_id === targetRegionId) {
        const { data } = await supabase
          .from('v_bouteilles_par_compartiment').select('*')
          .eq('region_id', targetRegionId)
          .order('date_limite', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: true })
        setBouteilles((data ?? []) as any)
      }
      setAddForPillar(null)
    }
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur bg-black/30 border-b border-[#2a1a21]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight text-[#e9d5d1]">La Cave des Guimaraes</h1>
          <div className="text-sm text-zinc-300">
            A déguster sans modération
          </div>
        </div>
      </header>

      {/* Grille : 5 colonnes sur grand écran, wrap automatique sans scroll horizontal */}
      <section className="max-w-7xl mx-auto pt-6 pb-16 px-4">
        <div
          className="
            grid gap-6
            grid-cols-1
            sm:grid-cols-2
            md:grid-cols-3
            lg:grid-cols-4
            xl:grid-cols-5
          "
        >
          {pillars.map((p) => {
            const regions = compsByPillar.get(p) ?? []
            return (
              <div
                key={p}
                className="bg-[#171217]/80 backdrop-blur rounded-xl shadow-xl ring-1 ring-[#2d1b22] p-3"
              >
                <div className="flex items-baseline justify-between pb-2 border-b border-[#2a1a21]">
                  <div>
                    <h2 className="text-lg font-semibold text-[#f0e6e4]">{pillarTitle(p)}</h2>
                    <div className="text-xs text-zinc-400">Pilier {p}</div>
                  </div>
                  <button
                    onClick={() => openAddForPillar(p)}
                    className="px-3 py-1.5 rounded-full bg-[#7b2d26] text-white text-xs hover:bg-[#6d2621] transition"
                  >
                    Ajouter un vin
                  </button>
                </div>

                {/* 4 compartiments en vertical */}
                <div className="mt-3 space-y-3">
                  {Array.from({ length: 4 }, (_, i) => {
                      const comp = regions.find(r => r.compartiment === i + 1)
                      return comp ?? {
                        region_id: -1_000 - i,
                        region_nom: '—',
                        pilier: p,
                        compartiment: i + 1,
                        nb_non_bues: 0,
                        prochaine_date_limite: null,
                        nb_rouge: 0,
                        nb_blanc: 0,
                        nb_rose: 0,
                      } as any
                    }).map((c) => (
                      <button
                      key={`${p}-${c.compartiment}-${c.region_id}`}
                      onClick={() => c.region_id > 0 && openCompartiment(c)}
                      className={[
                        'w-full text-left rounded-lg p-3 ring-1 transition hover:shadow-md',
                        c.region_id > 0
                          ? 'bg-[#1f171d] ring-[#2d1b22] hover:bg-[#251a20]'
                          : 'bg-[#191418] ring-[#2a1a21] opacity-60 cursor-default'
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-zinc-200">
                          {c.region_id > 0 ? c.region_nom : '—'}
                        </div>
                        <span className="inline-flex items-center justify-center min-w-7 h-7 rounded-full bg-[#7b2d26] text-white text-xs">
                          {c.nb_non_bues}
                        </span>
                      </div>
                      {c.nb_non_bues > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {/* pastilles de composition par type */}
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {(() => {
                              // limite 10 points d’aperçu
                              const cap = 10
                              let remaining = Math.min(c.nb_non_bues, cap)

                              const chunks: { n: number; cls: string }[] = []
                              const pushChunk = (n: number, cls: string) => {
                                const k = Math.min(n, remaining)
                                for (let i = 0; i < k; i++) chunks.push({ n: 1, cls })
                                remaining -= k
                              }

                              const clsRouge = 'bg-[#7b2d26]'
                              const clsBlanc = 'bg-white border border-zinc-400'
                              const clsRose  = 'bg-[#f2b6c1]'

                              pushChunk(c.nb_rouge, clsRouge)
                              pushChunk(c.nb_blanc, clsBlanc)
                              pushChunk(c.nb_rose,  clsRose)

                              return (
                                <>
                                  {chunks.map((it, i) => (
                                    <span key={i} className={`w-2.5 h-2.5 rounded-full ${it.cls}`} />
                                  ))}
                                  {c.nb_non_bues > cap && (
                                    <span className="text-[10px] text-zinc-400">
                                      +{c.nb_non_bues - cap}
                                    </span>
                                  )}
                                </>
                              )
                            })()}
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Modale : contenu d’un compartiment */}
      {selectedRegion && (
        <div
          onClick={() => { setSelectedRegion(null); setSelectedBouteille(null); }}
          className="fixed inset-0 z-20 bg-black/60 flex items-start justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl bg-[#171217] rounded-2xl shadow-2xl ring-1 ring-[#2d1b22] p-5 mt-10 mb-10 overflow-y-auto max-h-[90vh]"
          >
            <div className="p-5 border-b border-[#2a1a21] flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-[#f0e6e4]">{selectedRegion.region_nom}</h3>
                <p className="text-sm text-zinc-400">Pilier {selectedRegion.pilier}</p>
              </div>
              <button
                onClick={() => { setSelectedRegion(null); setSelectedBouteille(null); }}
                className="text-zinc-400 hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            <div className="p-5">
              {loadingBottles ? (
                <p className="text-zinc-300">Chargement…</p>
              ) : (
                <>
                  {/* pastilles colorées cliquables */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    {bouteilles.map((b) => (
                      <button
                        key={b.id}
                        title={`${b.nom}${b.annee ? ` (${b.annee})` : ''}`}
                        onClick={() => setSelectedBouteille(b)}
                        className={`w-5 h-5 rounded-full ring-1 ring-zinc-500 hover:scale-105 transition ${typeColor(b.type_vin)}`}
                      />
                    ))}
                  </div>

                  {/* Liste */}
                  <div className="overflow-x-auto rounded-xl ring-1 ring-[#2d1b22]">
                    <table className="min-w-full bg-[#1b1419]">
                      <thead className="bg-[#21171d] text-zinc-300">
                        <tr>
                          <th className="text-left py-2 px-3">Bouteille</th>
                          <th className="text-left py-2 px-3">Type</th>
                          <th className="text-left py-2 px-3">Cépage</th>
                          <th className="text-left py-2 px-3">À boire avant</th>
                          <th className="py-2 px-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bouteilles.map((b) => (
                          <tr key={b.id} className="border-t border-[#2a1a21] hover:bg-[#231a1f]">
                            <td className="py-2 px-3">
                              <button onClick={() => setSelectedBouteille(b)} className="text-left text-zinc-100">
                                <span className="font-medium">{b.nom}</span> {b.annee ? `(${b.annee})` : ''} {b.domaine ? `— ${b.domaine}` : ''}
                              </button>
                            </td>
                            <td className="py-2 px-3 text-zinc-200">{b.type_vin ?? '—'}</td>
                            <td className="py-2 px-3 text-zinc-200">{b.cepage ?? '—'}</td>
                            <td className="py-2 px-3 text-zinc-200">{b.date_limite ? new Date(b.date_limite).toLocaleDateString() : '—'}</td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2 justify-end">
                                <button
                                  className="px-3 py-1.5 rounded-full bg-[#7b2d26] text-white text-sm hover:bg-[#6d2621]"
                                  onClick={() => deleteAsDrunk(b)}
                                  title="Bue (supprimer)"
                                >
                                  Bue (supprimer)
                                </button>
                                <Link
                                  className="px-3 py-1.5 rounded-full bg-amber-300/90 text-[#3b1a1a] text-sm hover:bg-amber-300"
                                  href={`/bouteilles/${b.id}/edit`}
                                  title="Modifier"
                                >
                                  Modifier
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {bouteilles.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-4 px-3 text-center text-zinc-400">
                              Aucune bouteille non bue dans cette région.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Détails sélection */}
                  {selectedBouteille && (
                    <div className="mt-4 p-4 rounded-xl bg-[#21171d] ring-1 ring-[#2a1a1]">
                      <h4 className="font-semibold text-[#f0e6e4]">
                        {selectedBouteille.nom} {selectedBouteille.annee ? `(${selectedBouteille.annee})` : ''}
                      </h4>
                      <p className="text-sm text-zinc-300">
                        Type : {selectedBouteille.type_vin ?? '—'} · Cépage : {selectedBouteille.cepage ?? '—'} · Domaine : {selectedBouteille.domaine ?? '—'}
                      </p>
                      <p className="text-sm text-zinc-300">Accords : {selectedBouteille.accords ?? '—'}</p>
                      <p className="text-sm text-zinc-300">À boire avant : {selectedBouteille.date_limite ? new Date(selectedBouteille.date_limite).toLocaleDateString() : '—'}</p>

                      {/* 🆕 affichage des nouveaux champs */}
                      <p className="text-sm text-zinc-300">Date d’achat : {formatDateFR(selectedBouteille.date_achat)}</p>
                      <p className="text-sm text-zinc-300">Prix : {formatPrixEUR(selectedBouteille.prix)}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modale “Ajouter un vin” pour un pilier */}
      {addForPillar !== null && (
        <div
          onClick={() => setAddForPillar(null)}
          className="fixed inset-0 z-30 bg-black/70 flex items-start justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-[#171217] rounded-2xl shadow-2xl ring-1 ring-[#2d1b22] p-5 mt-10 mb-10 overflow-y-auto max-h-[90vh]"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-[#f0e6e4]">Ajouter un vin — Pilier {addForPillar}</h3>
              <button onClick={() => setAddForPillar(null)} className="text-zinc-400 hover:text-zinc-200">✕</button>
            </div>

            <form onSubmit={submitAdd} className="space-y-3">
              {/* Ligne : numéro de compartiment + quantité */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-zinc-300 mb-1">N° de compartiment</label>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    value={addCompartiment}
                    onChange={(e) => {
                      const v = Number(e.target.value)
                      setAddCompartiment(v)
                      const rid = getRegionIdByPillarAndCompartiment(addForPillar!, v)
                      setAddRegionId(rid)
                    }}
                    className="w-full rounded-lg bg-[#1f171d] border border-[#2d1b22] px-3 py-2 text-zinc-100"
                    required
                  />
                  <p className="mt-1 text-xs text-zinc-400">
                    Région&nbsp;: {addForPillar && addCompartiment ? (getRegionNameByPillarAndCompartiment(addForPillar, addCompartiment) ?? '—') : '—'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-zinc-300 mb-1">Quantité</label>
                  <input
                    type="number"
                    min={1}
                    max={48}
                    value={addQuantite}
                    onChange={(e) => setAddQuantite(Number(e.target.value))}
                    className="w-full rounded-lg bg-[#1f171d] border border-[#2d1b22] px-3 py-2 text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-300 mb-1">Année limite (à boire avant)</label>
                  <input
                    type="number"
                    value={addAnneeLimite}
                    onChange={(e) => setAddAnneeLimite(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-lg bg-[#1f171d] border border-[#2d1b22] px-3 py-2 text-zinc-100"
                    placeholder="ex : 2030"
                  />
                </div>
              </div>

              {/* Ligne : nom + année */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-300 mb-1">Nom *</label>
                  <input
                    value={addNom}
                    onChange={(e) => setAddNom(e.target.value)}
                    className="w-full rounded-lg bg-[#1f171d] border border-[#2d1b22] px-3 py-2 text-zinc-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-300 mb-1">Année</label>
                  <input
                    type="number"
                    value={addAnnee}
                    onChange={(e) => setAddAnnee(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-lg bg-[#1f171d] border border-[#2d1b22] px-3 py-2 text-zinc-100"
                    placeholder="ex : 2018"
                  />
                </div>
              </div>

              {/* Ligne : domaine + type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-300 mb-1">Domaine</label>
                  <input
                    value={addDomaine}
                    onChange={(e) => setAddDomaine(e.target.value)}
                    className="w-full rounded-lg bg-[#1f171d] border border-[#2d1b22] px-3 py-2 text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-300 mb-1">Type</label>
                  <select
                    value={addTypeVin}
                    onChange={(e) => setAddTypeVin(e.target.value as any)}
                    className="w-full rounded-lg bg-[#1f171d] border border-[#2d1b22] px-3 py-2 text-zinc-100"
                  >
                    <option value="">—</option>
                    <option value="rouge">rouge</option>
                    <option value="blanc">blanc</option>
                    <option value="rosé">rosé</option>
                  </select>
                </div>
              </div>

              {/* Ligne : cépage + accords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-300 mb-1">Cépage</label>
                  <input
                    list="cepages-list"
                    value={addCepage}
                    onChange={(e) => setAddCepage(e.target.value)}
                    className="w-full rounded-lg bg-[#1f171d] border border-[#2d1b22] px-3 py-2 text-zinc-100"
                    placeholder="Ex. : Chardonnay"
                  />
                  <datalist id="cepages-list">
                    {CEPAGES_POPULAIRES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm text-zinc-300 mb-1">Accords</label>
                  <input
                    value={addAccords}
                    onChange={(e) => setAddAccords(e.target.value)}
                    className="w-full rounded-lg bg-[#1f171d] border border-[#2d1b22] px-3 py-2 text-zinc-100"
                  />
                </div>
              </div>

              {/* Temps de conservation */}
              <div>
                <label className="block text-sm text-zinc-300 mb-1">Temps de conservation (années)</label>
                <input
                  type="number"
                  value={addTempsConservation}
                  onChange={(e) => setAddTempsConservation(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full rounded-lg bg-[#1f171d] border border-[#2d1b22] px-3 py-2 text-zinc-100"
                  placeholder="ex : 8"
                />
              </div>

              {/* 🆕 Date d’achat + Prix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-300 mb-1">Date d’achat</label>
                  <input
                    type="date"
                    value={addDateAchat}
                    onChange={(e) => setAddDateAchat(e.target.value)}
                    className="w-full rounded-lg bg-[#1f171d] border border-[#2d1b22] px-3 py-2 text-zinc-100"
                    placeholder="ex : 2025-11-15"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-300 mb-1">Prix (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={addPrix}
                    onChange={(e) => setAddPrix(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-lg bg-[#1f171d] border border-[#2d1b22] px-3 py-2 text-zinc-100"
                    placeholder="ex : 24.90"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={savingAdd}
                  className="px-4 py-2 rounded-lg bg-[#7b2d26] text-white hover:bg-[#6d2621]"
                >
                  {savingAdd ? 'Ajout…' : 'Ajouter'}
                </button>
                <button
                  type="button"
                  onClick={() => setAddForPillar(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-700/60 text-zinc-100 hover:bg-zinc-600/70"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
