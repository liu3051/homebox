import '@blueprintjs/core/lib/css/blueprint.css'

import React, { useCallback, useMemo } from 'react'
import { useState, useRef } from 'react'
import { HostChannel } from './channel'
import styled from '@emotion/styled'
import { Global, css } from '@emotion/core'
import { ChannelsContext, ConfigContext } from './context'
import { CaseRunner } from './components/case-runner'
import { CaseConfig } from './components/case-config'
import { DEFAULT_CONFIG } from './const'
import { RunCaseOnce } from './components/run-case-once'
import { LightTheme } from './styles/theme'
import { $globalStyle } from './styles/global'

const $Container = styled.div`
  padding: 12px 24px;
  max-width: 864px;
  margin: auto;
  height: 100%;
`
function createWorker() {
  return new Worker('./worker.ts')
}

export function App() {
  const channelsRef = useRef<HostChannel<any>[] | null>(null)
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const createChannels = useCallback(async () => {
    const { threadCount } = config
    if (channelsRef.current) {
      const channels = channelsRef.current!
      if (channels.length > threadCount) {
        for (let i = threadCount; i < channels.length; i++) {
          channels[i].terminate()
        }
        channels.splice(threadCount)
      } else if (channels.length < threadCount) {
        for (let i = channels.length; i < threadCount; i++) {
          channels.push(new HostChannel(createWorker()))
        }
      }
      return channels
    }

    channelsRef.current = new Array(config.threadCount).fill(0).map(() => new HostChannel(createWorker()))
    return channelsRef.current
  }, [config.threadCount])
  const $theme = useMemo(() => css(LightTheme), [])

  return (
      <ChannelsContext.Provider value={createChannels}>
        <ConfigContext.Provider value={config}>
          <Global
            styles={[$globalStyle, css`body { ${$theme} }`]}
          />
          <$Container>
            <CaseConfig defaultValue={config} onChange={setConfig}/>
            {config.duration !== Infinity ? <RunCaseOnce/> : (
              <div css={css`
              display: flex;
            `}>
              <CaseRunner title="Download" name="download"/>
              <CaseRunner title="Upload" name="upload"/>
            </div>
            )}
          </$Container>
        </ConfigContext.Provider>
      </ChannelsContext.Provider>
  )
}
