const rows = Array.from({ length: 5 }, (_, index) => index);

function SkeletonRows({ cards = false }) {
  return <div className={cards ? 'page-skeleton-list' : 'page-skeleton-rows'} aria-hidden="true">
    {rows.map(index => <div className={cards ? 'page-skeleton-list-row' : 'page-skeleton-row'} key={index}>
      {cards ? <><i/><span><i/><i/></span><i/></> : <><i/><i/><i/><i/><i/></>}
    </div>)}
  </div>;
}

export function TableSkeleton() {
  return <div className="page-skeleton-table" role="status" aria-label="Chargement">
    <div className="page-skeleton-table-head" aria-hidden="true">{rows.map(index => <i key={index}/>)}</div>
    <SkeletonRows/>
  </div>;
}

export function ListSkeleton() {
  return <div role="status" aria-label="Chargement"><SkeletonRows cards/></div>;
}

export default function PageSkeleton({ variant = 'dashboard' }) {
  return <div className={`page-skeleton page-skeleton--${variant}`} role="status" aria-label="Chargement" aria-busy="true">
    <div className="page-skeleton-heading" aria-hidden="true">
      <div><i/><i/><i/></div><i/>
    </div>
    {(variant === 'table' || variant === 'alerts') && <div className="page-skeleton-toolbar" aria-hidden="true"><i/><i/></div>}
    {(variant === 'dashboard' || variant === 'detail' || variant === 'profile' || variant === 'overview') && <div className="page-skeleton-kpis" aria-hidden="true">{rows.slice(0, 4).map(index => <div key={index}><i/><i/><i/></div>)}</div>}
    <div className="page-skeleton-content" aria-hidden="true">
      {variant === 'dashboard' || variant === 'overview' ? <><div className="page-skeleton-panel page-skeleton-chart"><i/><i/><i/></div><div className="page-skeleton-panel page-skeleton-side">{rows.slice(0, 3).map(index => <i key={index}/>)}</div><div className="page-skeleton-panel page-skeleton-wide"/></> : null}
      {variant === 'table' || variant === 'alerts' ? <div className="page-skeleton-panel page-skeleton-wide"><div className="page-skeleton-panel-head"><i/><i/></div><SkeletonRows/></div> : null}
      {variant === 'maintenance' || variant === 'form' ? <><div className="page-skeleton-panel page-skeleton-form">{rows.slice(0, 5).map(index => <i key={index}/>)}</div><div className="page-skeleton-panel page-skeleton-side">{rows.slice(0, 4).map(index => <i key={index}/>)}</div></> : null}
      {variant === 'detail' || variant === 'profile' ? <><div className="page-skeleton-panel page-skeleton-wide page-skeleton-chart"><i/><i/><i/></div><div className="page-skeleton-panel page-skeleton-wide"><SkeletonRows/></div></> : null}
      {variant === 'settings' ? rows.slice(0, 4).map(index => <div className="page-skeleton-panel page-skeleton-setting" key={index}><i/><i/><i/></div>) : null}
    </div>
  </div>;
}