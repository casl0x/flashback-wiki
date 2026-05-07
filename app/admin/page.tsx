'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Character, Player, Version } from '@/lib/db'
import { useAdmin } from '@/lib/useAdmin'

const REL_TYPES=['Père','Mère','Fils','Fille','Frère','Sœur','Cousin','Cousine','Oncle','Tante','Grand-père','Grand-mère','Ami','Amie','Associé','Associée','Rival','Rivale','Ennemi','Ennemie','Mentor','Protégé','Partenaire','Ex','Autre']
function vClass(v:string){return({V1:'v1b',V2:'v2b',V3:'v3b',V4:'v4b'} as Record<string,string>)[v]||'v4b'}

const S=`
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Inter:wght@400;500&display=swap');
.ar{min-height:100vh;background:#0d0c10;font-family:'Inter',sans-serif;color:#e2dff0}
.an{display:flex;align-items:center;justify-content:space-between;padding:11px 22px;border-bottom:0.5px solid #1e1c2a;background:#111019;position:sticky;top:0;z-index:10}
.anb{display:flex;align-items:center;gap:9px}
.al{width:28px;height:28px;background:#7C3AED;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:15px;color:white}
.at2{font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700;color:#e2dff0;letter-spacing:.5px}
.at2 span{color:#a78bfa}
.abadge{font-size:10px;padding:3px 9px;background:#2a1040;border:0.5px solid #4c2d8a;border-radius:99px;color:#a78bfa;font-weight:600;letter-spacing:.3px}
.abody{padding:20px 24px;max-width:1000px;margin:0 auto}
.atabs{display:flex;gap:4px;margin-bottom:20px;border-bottom:0.5px solid #1e1c2a}
.atab{padding:8px 16px;font-size:13px;border-radius:8px 8px 0 0;cursor:pointer;border:0.5px solid transparent;border-bottom:none;background:transparent;color:#4a4560;transition:all .15s;margin-bottom:-0.5px}
.atab:hover{color:#8880a8;background:#1a1824}
.atab.on{background:#111019;border-color:#2a2535;border-bottom-color:#111019;color:#e2dff0;font-weight:500}
.asec{font-family:'Rajdhani',sans-serif;font-size:17px;font-weight:700;color:#e2dff0;letter-spacing:.3px;margin-bottom:13px;display:flex;align-items:center;gap:8px}
.asec::before{content:'';width:3px;height:16px;background:#7C3AED;border-radius:99px;display:block}
.amb{position:fixed;inset:0;background:rgba(0,0,0,.75);display:flex;align-items:flex-start;justify-content:center;padding:30px 16px;z-index:100;overflow-y:auto}
.am{background:#111019;border:0.5px solid #2a2535;border-radius:12px;padding:22px;width:100%;max-width:520px;display:flex;flex-direction:column;gap:13px}
.amh{display:flex;align-items:center;justify-content:space-between}
.amt{font-family:'Rajdhani',sans-serif;font-size:17px;font-weight:700;color:#e2dff0;letter-spacing:.3px}
.re{display:flex;align-items:center;justify-content:space-between;padding:7px 10px;background:#1a1824;border-radius:8px;font-size:13px;border:0.5px solid #2a2535}
.rtb{font-size:10px;padding:2px 8px;border-radius:99px;background:#2a1040;border:0.5px solid #4c2d8a;color:#a78bfa;font-family:'Rajdhani',sans-serif;font-weight:600}
`

function AdminContent(){
  const searchParams=useSearchParams()
  const router=useRouter()
  const{isAdmin,checking,adminFetch}=useAdmin()
  const[tab,setTab]=useState<'chars'|'players'|'versions'>('chars')
  const[chars,setChars]=useState<Character[]>([])
  const[players,setPlayers]=useState<Player[]>([])
  const[versions,setVersions]=useState<Version[]>([])
  const[loading,setLoading]=useState(true)
  const[modal,setModal]=useState<null|'add-char'|'edit-char'|'edit-player'|'add-version'|'edit-version'>(null)
  const[editing,setEditing]=useState<any>(null)
  const[editRels,setEditRels]=useState<{type:string,targetId:number}[]>([])
  const[toast,setToast]=useState<{msg:string,type:'ok'|'err'}|null>(null)

  function showToast(msg:string,type:'ok'|'err'='ok'){setToast({msg,type});setTimeout(()=>setToast(null),2800)}

  async function load(){
    const r=await fetch('/api/data')
    const d=await r.json()
    setVersions(d.versions||[]);setPlayers(d.players||[]);setChars(d.characters||[]);setLoading(false)
  }

  useEffect(()=>{if(!checking){if(!isAdmin){router.push('/')}else{load()}}},[checking,isAdmin])

  async function saveChar(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault()
    const fd=new FormData(e.currentTarget)
    const body:any={name:fd.get('name'),job:fd.get('job'),description:fd.get('description'),tags:String(fd.get('tags')).split(',').map((t:string)=>t.trim()).filter(Boolean),version_id:fd.get('version_id'),player_id:fd.get('player_id')}
    let charId:number
    if(editing?.id){
      const res=await adminFetch('/api/characters',{method:'PATCH',body:JSON.stringify({id:editing.id,...body})})
      const data=await res.json();if(!res.ok){showToast(data.error,'err');return}
      charId=editing.id;showToast(`${body.name} mis à jour !`)
    } else {
      const res=await adminFetch('/api/characters',{method:'POST',body:JSON.stringify(body)})
      const data=await res.json();if(!res.ok){showToast(data.error,'err');return}
      charId=data.id;showToast(`${body.name} créé !`)
    }
    await adminFetch('/api/relations',{method:'PUT',body:JSON.stringify({character_id:charId})})
    await Promise.all(editRels.map(r=>adminFetch('/api/relations',{method:'POST',body:JSON.stringify({character_id:charId,target_id:r.targetId,relation_type:r.type})})))
    setModal(null);load()
  }

  async function deleteChar(id:number,name:string){
    if(!confirm(`Supprimer "${name}" ?`)) return
    const res=await adminFetch('/api/characters',{method:'DELETE',body:JSON.stringify({id})})
    if(!res.ok){showToast('Erreur','err');return}
    showToast('Supprimé');load()
  }

  async function savePlayer(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault()
    const fd=new FormData(e.currentTarget)
    const body={id:editing?.id,discord:fd.get('discord'),tiktok:fd.get('tiktok'),stream_url:fd.get('stream_url')}
    const res=await adminFetch('/api/players',{method:'PATCH',body:JSON.stringify(body)})
    if(!res.ok){showToast('Erreur','err');return}
    showToast('Joueur mis à jour !');setModal(null);load()
  }

  async function saveVersion(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault()
    const fd=new FormData(e.currentTarget)
    const body={id:fd.get('id'),label:fd.get('label'),description:fd.get('description')}
    const method=editing?.id?'PATCH':'POST'
    const payload=editing?.id?{...body,id:editing.id}:body
    const res=await adminFetch('/api/versions',{method,body:JSON.stringify(payload)})
    if(!res.ok){const d=await res.json();showToast(d.error,'err');return}
    showToast('Version enregistrée !');setModal(null);load()
  }

  async function deleteVersion(id:string){
    if(chars.some(c=>c.version_id===id)){showToast('Retire d\'abord les personnages','err');return}
    if(!confirm(`Supprimer ${id} ?`)) return
    const res=await adminFetch('/api/versions',{method:'DELETE',body:JSON.stringify({id})})
    if(!res.ok){showToast('Erreur','err');return}
    showToast('Version supprimée');load()
  }

  if(checking||loading) return <div style={{padding:60,textAlign:'center',color:'#4a4560',background:'#0d0c10',minHeight:'100vh'}}>Chargement...</div>

  const adminToken=searchParams.get('token')||(typeof window!=='undefined'?localStorage.getItem('admin_token'):'')||''
  const inp={background:'#1a1824',border:'0.5px solid #2a2535',borderRadius:8,padding:'8px 11px',fontSize:13,color:'#e2dff0',fontFamily:'Inter,sans-serif',width:'100%',outline:'none'}
  const lbl={fontSize:11,fontWeight:500,color:'#4a4560',textTransform:'uppercase' as const,letterSpacing:'.5px',display:'block',marginBottom:4}
  const bP={padding:'8px 16px',fontSize:13,fontWeight:500,background:'#7C3AED',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Inter,sans-serif'}
  const bS={padding:'8px 16px',fontSize:13,border:'0.5px solid #2a2535',borderRadius:8,background:'transparent',color:'#8880a8',cursor:'pointer',fontFamily:'Inter,sans-serif'}

  return(
    <>
      <style>{S}</style>
      <div className="ar">
        <nav className="an">
          <div className="anb">
            <div className="al">⚡</div>
            <span className="at2">FLASH<span>BACK</span> WL</span>
            <span className="abadge">ADMIN</span>
          </div>
          <a href={`/?token=${adminToken}`} style={{...bS,textDecoration:'none',fontSize:12}}>← Wiki public</a>
        </nav>
        <div className="abody">
          <div className="atabs">
            {(['chars','players','versions'] as const).map(t=>(
              <button key={t} className={`atab ${tab===t?'on':''}`} onClick={()=>setTab(t)}>
                {t==='chars'?'Personnages':t==='players'?'Joueurs':'Versions'}
              </button>
            ))}
          </div>

          {tab==='chars'&&(
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                <div className="asec">Personnages <span style={{fontSize:13,color:'#4a4560',fontFamily:'Inter',fontWeight:400}}>({chars.length})</span></div>
                <button style={bP} onClick={()=>{setEditing(null);setEditRels([]);setModal('add-char')}}>+ Nouveau personnage</button>
              </div>
              <div className="table-wrap">
                <table><thead><tr>
                  <th style={{width:'22%'}}>Nom</th><th style={{width:'16%'}}>Joueur</th>
                  <th style={{width:'8%'}}>Ver.</th><th style={{width:'22%'}}>Rôle</th>
                  <th style={{width:'10%'}}>Liens</th><th style={{width:'22%'}}>Actions</th>
                </tr></thead>
                <tbody>{chars.length?chars.map(c=>(
                  <tr key={c.id}>
                    <td><strong>{c.name}</strong></td>
                    <td>{(c.player as any)?.pseudo}</td>
                    <td><span className={`vpill ${vClass(c.version_id)}`}>{c.version_id}</span></td>
                    <td>{c.job}</td>
                    <td style={{color:'#a78bfa'}}>{(c.relations||[]).length}</td>
                    <td>
                      <button className="btn-icon edit" onClick={()=>{setEditing(c);setEditRels((c.relations||[]).map((r:any)=>({type:r.relation_type,targetId:r.target_id})));setModal('edit-char')}}>✏️</button>
                      <button className="btn-icon del" onClick={()=>deleteChar(c.id!,c.name)}>🗑</button>
                    </td>
                  </tr>
                )):<tr><td colSpan={6}><div className="empty">Aucun personnage</div></td></tr>}</tbody>
                </table>
              </div>
            </div>
          )}

          {tab==='players'&&(
            <div>
              <div className="asec">Joueurs <span style={{fontSize:13,color:'#4a4560',fontFamily:'Inter',fontWeight:400}}>({players.length})</span></div>
              <div className="table-wrap">
                <table><thead><tr>
                  <th style={{width:'18%'}}>Pseudo</th><th style={{width:'16%'}}>Discord</th>
                  <th style={{width:'16%'}}>TikTok/IG</th><th style={{width:'30%'}}>Stream</th>
                  <th style={{width:'10%'}}>Persos</th><th style={{width:'10%'}}>Actions</th>
                </tr></thead>
                <tbody>{players.map(p=>(
                  <tr key={p.id}>
                    <td><strong>{p.pseudo}</strong></td>
                    <td>{p.discord||'—'}</td><td>{p.tiktok||'—'}</td>
                    <td title={p.stream_url||''}>{p.stream_url||'—'}</td>
                    <td style={{color:'#a78bfa'}}>{chars.filter(c=>(c.player as any)?.id===p.id).length}</td>
                    <td><button className="btn-icon edit" onClick={()=>{setEditing(p);setModal('edit-player')}}>✏️</button></td>
                  </tr>
                ))}</tbody>
                </table>
              </div>
            </div>
          )}

          {tab==='versions'&&(
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                <div className="asec">Versions</div>
                <button style={bP} onClick={()=>{setEditing(null);setModal('add-version')}}>+ Nouvelle version</button>
              </div>
              <div className="table-wrap">
                <table><thead><tr>
                  <th style={{width:'10%'}}>ID</th><th style={{width:'22%'}}>Nom</th>
                  <th style={{width:'40%'}}>Description</th><th style={{width:'12%'}}>Persos</th><th style={{width:'16%'}}>Actions</th>
                </tr></thead>
                <tbody>{versions.map(v=>(
                  <tr key={v.id}>
                    <td><span className={`vpill ${vClass(v.id)}`}>{v.id}</span></td>
                    <td><strong>{v.label}</strong></td><td>{v.description||'—'}</td>
                    <td style={{color:'#a78bfa'}}>{chars.filter(c=>c.version_id===v.id).length}</td>
                    <td>
                      <button className="btn-icon edit" onClick={()=>{setEditing(v);setModal('edit-version')}}>✏️</button>
                      <button className="btn-icon del" onClick={()=>deleteVersion(v.id)}>🗑</button>
                    </td>
                  </tr>
                ))}</tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {(modal==='add-char'||modal==='edit-char')&&(
          <div className="amb" onClick={e=>{if(e.target===e.currentTarget)setModal(null)}}>
            <div className="am">
              <div className="amh"><span className="amt">{editing?.id?`Modifier — ${editing.name}`:'Nouveau personnage'}</span><button style={bS} onClick={()=>setModal(null)}>Fermer</button></div>
              <form onSubmit={saveChar} style={{display:'flex',flexDirection:'column',gap:12}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  <div><label style={lbl}>Nom</label><input name="name" defaultValue={editing?.name||''} required style={inp}/></div>
                  <div><label style={lbl}>Rôle / Métier</label><input name="job" defaultValue={editing?.job||''} required style={inp}/></div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  <div><label style={lbl}>Joueur</label>
                    <select name="player_id" defaultValue={(editing?.player as any)?.id||''} required style={inp}>
                      <option value="">— Sélectionner —</option>
                      {players.map(p=><option key={p.id} value={p.id}>{p.pseudo}</option>)}
                    </select>
                  </div>
                  <div><label style={lbl}>Version</label>
                    <select name="version_id" defaultValue={editing?.version_id||''} required style={inp}>
                      <option value="">— Sélectionner —</option>
                      {versions.map(v=><option key={v.id} value={v.id}>{v.id} — {v.label}</option>)}
                    </select>
                  </div>
                </div>
                <div><label style={lbl}>Description</label><textarea name="description" defaultValue={editing?.description||''} style={{...inp,resize:'vertical' as const,minHeight:60}}/></div>
                <div><label style={lbl}>Tags (virgules)</label><input name="tags" defaultValue={(editing?.tags||[]).join(', ')} style={inp}/></div>
                <div>
                  <label style={lbl}>Relations</label>
                  <div style={{display:'flex',gap:7,marginBottom:8}}>
                    <select id="nrt" style={{...inp,flex:1}}>{REL_TYPES.map(t=><option key={t}>{t}</option>)}</select>
                    <select id="nrtg" style={{...inp,flex:2}}>
                      {chars.filter(c=>c.id!==editing?.id).map(c=><option key={c.id} value={c.id}>{c.name} ({c.version_id})</option>)}
                    </select>
                    <button type="button" style={{...bS,padding:'8px 12px',flexShrink:0}} onClick={()=>{
                      const type=(document.getElementById('nrt') as HTMLSelectElement).value
                      const targetId=parseInt((document.getElementById('nrtg') as HTMLSelectElement).value)
                      if(!targetId||editRels.find(r=>r.targetId===targetId)) return
                      setEditRels([...editRels,{type,targetId}])
                    }}>+</button>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:5}}>
                    {editRels.map((r,i)=>{
                      const tc=chars.find(c=>c.id===r.targetId)
                      return(
                        <div key={i} className="re">
                          <div style={{display:'flex',alignItems:'center',gap:8}}><span className="rtb">{r.type}</span><span style={{color:'#e2dff0',fontSize:13}}>{tc?.name||'?'}</span></div>
                          <button type="button" style={{...bS,padding:'3px 8px',fontSize:12}} onClick={()=>setEditRels(editRels.filter((_,j)=>j!==i))}>✕</button>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:4}}>
                  <button type="button" style={bS} onClick={()=>setModal(null)}>Annuler</button>
                  <button type="submit" style={bP}>{editing?.id?'Enregistrer':'Créer'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {modal==='edit-player'&&editing&&(
          <div className="amb" onClick={e=>{if(e.target===e.currentTarget)setModal(null)}}>
            <div className="am" style={{maxWidth:400}}>
              <div className="amh"><span className="amt">{editing.pseudo}</span><button style={bS} onClick={()=>setModal(null)}>Fermer</button></div>
              <form onSubmit={savePlayer} style={{display:'flex',flexDirection:'column',gap:12}}>
                <div><label style={lbl}>Pseudo</label><input value={editing.pseudo} disabled style={{...inp,opacity:.4}}/></div>
                <div><label style={lbl}>Discord</label><input name="discord" defaultValue={editing.discord||''} style={inp}/></div>
                <div><label style={lbl}>TikTok / Instagram</label><input name="tiktok" defaultValue={editing.tiktok||''} placeholder="@pseudo" style={inp}/></div>
                <div><label style={lbl}>Lien Twitch / YouTube</label><input name="stream_url" defaultValue={editing.stream_url||''} placeholder="https://..." style={inp}/></div>
                <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                  <button type="button" style={bS} onClick={()=>setModal(null)}>Annuler</button>
                  <button type="submit" style={bP}>Enregistrer</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {(modal==='add-version'||modal==='edit-version')&&(
          <div className="amb" onClick={e=>{if(e.target===e.currentTarget)setModal(null)}}>
            <div className="am" style={{maxWidth:380}}>
              <div className="amh"><span className="amt">{editing?`Modifier ${editing.id}`:'Nouvelle version'}</span><button style={bS} onClick={()=>setModal(null)}>Fermer</button></div>
              <form onSubmit={saveVersion} style={{display:'flex',flexDirection:'column',gap:12}}>
                {!editing&&<div><label style={lbl}>Identifiant (ex: V5)</label><input name="id" placeholder="V5" required style={inp}/></div>}
                <div><label style={lbl}>Nom affiché</label><input name="label" defaultValue={editing?.label||''} required style={inp}/></div>
                <div><label style={lbl}>Description</label><input name="description" defaultValue={editing?.description||''} style={inp}/></div>
                <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                  <button type="button" style={bS} onClick={()=>setModal(null)}>Annuler</button>
                  <button type="submit" style={bP}>{editing?'Enregistrer':'Créer'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {toast&&<div className={`toast ${toast.type}`}>{toast.msg}</div>}
      </div>
    </>
  )
}

export default function AdminPage(){
  return(
    <Suspense fallback={<div style={{padding:60,textAlign:'center',color:'#4a4560',background:'#0d0c10',minHeight:'100vh'}}>Chargement...</div>}>
      <AdminContent/>
    </Suspense>
  )
}
