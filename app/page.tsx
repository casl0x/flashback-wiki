'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Character, Version, Player } from '@/lib/db'
import { useAdmin } from '@/lib/useAdmin'
import styles from './page.module.css'

const AVATARS=[['#1a2540','#60a5fa','#1e3a6e'],['#1a2e1a','#4ade80','#1a4a1a'],['#2e1a10','#fb923c','#4a2a10'],['#2a1040','#a78bfa','#4c2d8a'],['#1e1530','#c084fc','#5b21b6'],['#102030','#38bdf8','#0e4a6e']]
function pColor(name:string){const i=((name.charCodeAt(0)||0)+(name.charCodeAt(1)||0))%AVATARS.length;return AVATARS[i]}
function ini(name:string){return name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase()}
function vClass(v:string){return({V1:'v1b',V2:'v2b',V3:'v3b',V4:'v4b'} as Record<string,string>)[v]||'v4b'}

function WikiContent({chars,versions,selVer,setSelVer,query}:{chars:Character[],versions:Version[],selVer:string,setSelVer:(v:string)=>void,query:string}){
  const searchParams=useSearchParams()
  const {isAdmin}=useAdmin()
  const [selChar,setSelChar]=useState<Character|null>(null)

  useEffect(()=>{setSelChar(null)},[selVer,query])

  const filtered=chars.filter(c=>{
    const mv=selVer==='all'||c.version_id===selVer
    const q=query.toLowerCase()
    const ms=!q||c.name.toLowerCase().includes(q)||(c.player as any)?.pseudo?.toLowerCase().includes(q)||c.job.toLowerCase().includes(q)||(c.tags||[]).some((t:string)=>t.toLowerCase().includes(q))
    return mv&&ms
  })

  if(selChar){
    const pl=selChar.player as any
    const rels=selChar.relations||[]
    const others=chars.filter(c=>(c.player as any)?.id===pl?.id&&c.id!==selChar.id)
    const[pbg,pfg,pbd]=pColor(pl?.pseudo||'')
    const[cbg,cfg,cbd]=pColor(selChar.name)
    return(
      <div className={styles.content}>
        <button className={styles.backBtn} onClick={()=>setSelChar(null)}>← Retour</button>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div className={styles.detailCard}>
            <div className={styles.detailTop}>
              <div className={styles.detailAvatar} style={{background:cbg,color:cfg,borderColor:cbd}}>{ini(selChar.name)}</div>
              <div>
                <div className={styles.detailName}>{selChar.name}</div>
                <div className={styles.detailJob}>{selChar.job}</div>
                <span className={`vpill ${vClass(selChar.version_id)}`}>{selChar.version_id}</span>
              </div>
            </div>
            {selChar.description&&<p className={styles.detailDesc}>{selChar.description}</p>}
            {(selChar.tags||[]).length>0&&<div className={styles.tagList}>{(selChar.tags||[]).map((t:string)=><span key={t} className={styles.tag}>{t}</span>)}</div>}
            {rels.length>0&&(
              <div>
                <div className={styles.relsTitle}>Relations</div>
                <div className={styles.relsList}>
                  {rels.map((r:any)=>{
                    const tc=r.target;if(!tc)return null
                    const[tb,tf,tbd]=pColor(tc.name)
                    return(
                      <div key={r.id} className={styles.relItem} onClick={()=>{const full=chars.find(c=>c.id===tc.id);if(full)setSelChar(full)}}>
                        <div style={{display:'flex',alignItems:'center',gap:9}}>
                          <span className={styles.relType}>{r.relation_type}</span>
                          <div><div className={styles.relName}>{tc.name}</div><div className={styles.relSub}>{tc.player?.pseudo} — {tc.version_id}</div></div>
                        </div>
                        <div className={styles.relAvatar} style={{background:tb,color:tf,borderColor:tbd}}>{ini(tc.name)}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          <div className={styles.playerCard}>
            <div className={styles.playerTop}>
              <div className={styles.playerAvatar} style={{background:pbg,color:pfg,borderColor:pbd}}>{ini(pl?.pseudo||'?')}</div>
              <div><div className={styles.playerName}>{pl?.pseudo}</div><div className={styles.playerSub}>{others.length+1} personnage{others.length+1>1?'s':''} au total</div></div>
            </div>
            <div className={styles.socialLinks}>
              {pl?.discord&&<span className={styles.socialChip}><i className="ti ti-brand-discord" style={{fontSize:13}} aria-hidden="true"></i>{pl.discord}</span>}
              {pl?.tiktok&&<span className={styles.socialChip}><i className="ti ti-brand-tiktok" style={{fontSize:13}} aria-hidden="true"></i>{pl.tiktok}</span>}
              {pl?.stream_url&&<a href={pl.stream_url} target="_blank" rel="noreferrer" className={styles.socialChip}><i className={`ti ${pl.stream_url.includes('twitch')?'ti-brand-twitch':'ti-brand-youtube'}`} style={{fontSize:13}} aria-hidden="true"></i>{pl.stream_url.includes('twitch')?'Twitch':'YouTube'}</a>}
              {!pl?.discord&&!pl?.tiktok&&!pl?.stream_url&&<span style={{fontSize:12,color:'#3d3a52'}}>Aucun réseau renseigné</span>}
            </div>
            {others.length>0&&(
              <div>
                <div className={styles.otherCharsLabel}>Autres personnages</div>
                <div className={styles.otherCharsList}>
                  {others.map(o=>(
                    <div key={o.id} className={styles.otherCharItem} onClick={()=>setSelChar(o)}>
                      <div><div className={styles.otherCharName}>{o.name}</div><div className={styles.otherCharJob}>{o.job}</div></div>
                      <span className={`vpill ${vClass(o.version_id)}`}>{o.version_id}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const upl=[...new Set(filtered.map(c=>(c.player as any)?.id))].length
  return(
    <div className={styles.content}>
      <div className={styles.contentTop}>
        <div>
          <div className={styles.contentTitle}>{selVer==='all'?'Tous les personnages':versions.find(v=>v.id===selVer)?.label||selVer}</div>
          <div className={styles.contentSub}>{filtered.length} personnage{filtered.length!==1?'s':''} — {upl} joueur{upl!==1?'s':''}</div>
        </div>
        {isAdmin&&(
          <a href={`/admin?token=${searchParams.get('token')||''}`}
            style={{display:'inline-flex',alignItems:'center',gap:6,padding:'7px 14px',fontSize:12,fontWeight:500,background:'#1e1530',border:'0.5px solid #4c2d8a',borderRadius:8,color:'#a78bfa',textDecoration:'none'}}>
            <i className="ti ti-settings" style={{fontSize:13}} aria-hidden="true"></i> Admin
          </a>
        )}
      </div>
      <div className={styles.accentBar}><div className={styles.accentDot}></div><div className={styles.accentLine}></div></div>
      {filtered.length===0
        ?<div className="empty"><i className="ti ti-ghost" aria-hidden="true"></i>Aucun personnage trouvé</div>
        :<div className={styles.grid}>
          {filtered.map(c=>{
            const[bg,fg,bd]=pColor(c.name)
            return(
              <div key={c.id} className={styles.charCard} onClick={()=>setSelChar(c)}>
                <div className={styles.avatar} style={{background:bg,color:fg,borderColor:bd}}>{ini(c.name)}</div>
                <div className={styles.charName}>{c.name}</div>
                <div className={styles.charJob}>{c.job}</div>
                <div className={styles.charMeta}><span className={`vpill ${vClass(c.version_id)}`}>{c.version_id}</span><span className={styles.charPlayer}>{(c.player as any)?.pseudo}</span></div>
              </div>
            )
          })}
        </div>
      }
    </div>
  )
}

export default function HomePage(){
  const[data,setData]=useState<{versions:Version[],players:Player[],characters:Character[]}>({versions:[],players:[],characters:[]})
  const[selVer,setSelVer]=useState('all')
  const[query,setQuery]=useState('')
  const[loading,setLoading]=useState(true)

  useEffect(()=>{
    fetch('/api/data').then(r=>r.json()).then(d=>{setData(d);setLoading(false)}).catch(()=>setLoading(false))
  },[])

  const counts:Record<string,number>={}
  data.characters.forEach(c=>{counts[c.version_id]=(counts[c.version_id]||0)+1})
  const totalRels=data.characters.reduce((acc,c)=>acc+(c.relations?.length||0),0)

  const vBadgeBg=(id:string)=>({V1:'#1a2540',V2:'#1a2e1a',V3:'#2e1a10',V4:'#2a1040'} as Record<string,string>)[id]||'#1e1530'
  const vBadgeFg=(id:string)=>({V1:'#60a5fa',V2:'#4ade80',V3:'#fb923c',V4:'#a78bfa'} as Record<string,string>)[id]||'#a78bfa'

  return(
    <div className={styles.root}>
      <nav className={styles.nav}>
        <div className={styles.navBrand}>
          <div className={styles.logoMark}>⚡</div>
          <div><div className={styles.navTitle}>FLASH<span>BACK</span></div></div>
          <span className={styles.navSub}>— Wiki WL</span>
        </div>
        <div className={styles.navSearch}>
          <i className="ti ti-search" style={{fontSize:13,color:'#4a4560'}} aria-hidden="true"></i>
          <input type="text" placeholder="Rechercher un personnage..." value={query} onChange={e=>setQuery(e.target.value)}/>
        </div>
        <div className={styles.navStats}>
          <span className={styles.navStat}><strong>{data.characters.length}</strong> persos</span>
          <span className={styles.navStat}><strong>{data.players.length}</strong> joueurs</span>
          <span className={styles.navStat}><strong>{data.versions.length}</strong> versions</span>
        </div>
      </nav>
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <div className={styles.sbLabel}>Versions</div>
          {[{id:'all',label:'Tout voir'},...data.versions].map(v=>{
            const isOn=selVer===v.id
            const bg=v.id==='all'?'#1e1c2a':vBadgeBg(v.id)
            const fg=v.id==='all'?'#6b6880':vBadgeFg(v.id)
            return(
              <div key={v.id} className={`${styles.verBtn} ${isOn?styles.verBtnOn:''}`} onClick={()=>setSelVer(v.id)}>
                <div className={styles.verBtnL}>
                  <div className={styles.verBadge} style={{background:bg,color:fg}}>
                    {v.id==='all'?<i className="ti ti-layout-grid" style={{fontSize:10}} aria-hidden="true"></i>:v.id}
                  </div>
                  <span className={styles.verName}>{v.id==='all'?'Tout voir':v.label}</span>
                </div>
                <span className={styles.verCount}>{v.id==='all'?data.characters.length:counts[v.id]||0}</span>
              </div>
            )
          })}
          <div className={styles.sbDivider}>
            <div className={styles.sbLabel} style={{paddingTop:10}}>Statistiques</div>
            <div className={styles.sbStatRow}><span className={styles.sbStatLabel}>Personnages</span><span className={styles.sbStatVal}>{data.characters.length}</span></div>
            <div className={styles.sbStatRow}><span className={styles.sbStatLabel}>Joueurs</span><span className={styles.sbStatVal}>{data.players.length}</span></div>
            <div className={styles.sbStatRow}><span className={styles.sbStatLabel}>Relations</span><span className={styles.sbStatVal}>{totalRels}</span></div>
          </div>
        </aside>
        {loading
          ?<div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'#4a4560',fontSize:14}}>Chargement...</div>
          :<Suspense fallback={<div style={{flex:1,padding:40,color:'#4a4560'}}>Chargement...</div>}>
            <WikiContent chars={data.characters} versions={data.versions} selVer={selVer} setSelVer={setSelVer} query={query}/>
          </Suspense>
        }
      </div>
    </div>
  )
}
