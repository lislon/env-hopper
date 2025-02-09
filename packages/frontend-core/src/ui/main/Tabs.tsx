import React from 'react'

const tabList = [
  { label: 'Jump', value: 'jump' },
  { label: 'Logs', value: 'logs' },
]

export function Tabs({ children }: { children: Array<React.ReactNode> }) {
  const [active, setActive] = React.useState('jump')
  return (
    <div className="mb-4">
      <div role="tablist" className="tabs tabs-boxed">
        {tabList.map((tab) => (
          <a
            key={tab.value}
            role="tab"
            className={`tab${active === tab.value ? ' tab-active' : ''}`}
            onClick={() => setActive(tab.value)}
          >
            {tab.label}
          </a>
        ))}
      </div>
      <div className="mt-4">
        {active === 'jump' ? children[0] : children[1]}
      </div>
    </div>
  )
}
