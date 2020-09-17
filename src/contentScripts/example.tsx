import ReactDOM from 'react-dom';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { browser, Tabs, Runtime } from 'webextension-polyfill-ts';

function Command() {
  const [shouldShow, setShouldShow] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [openTabs, setOpenTabs] = useState<Tabs.Tab[]>([]);
  const [tabQuery, setTabQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>();
  const messagePort = useRef<Runtime.Port>();

  const filteredTabs = useMemo(() => {
    return openTabs
      .sort((tabA, tabB) => (tabA.active ? -1 : tabB.active ? 1 : 0))
      .filter((tab) => !tabQuery.length || tabMatchesQuery(tab, tabQuery));
  }, [openTabs, tabQuery]);

  useEffect(() => {
    document.addEventListener('keydown', (e) => {
      if (e.which === 74 && e.metaKey) {
        setShouldShow(true);
      }
      if (e.which === 27) {
        setShouldShow(false);
      }
    });
    console.log('Waiting for messages....');
    const port = browser.runtime.connect('hmpaddiadphmmodondnnklkcblndkmic');
    messagePort.current = port;
    port.onMessage.addListener((msg) => {
      if (msg.openTabs) {
        setOpenTabs(msg.openTabs);
      }
    });
  }, []);

  useEffect(() => {
    if (shouldShow && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.onblur = () => {
        setShouldShow(false);
      };
    }
    if (!shouldShow) {
      setActiveIndex(0);
      setTabQuery('');
    }
  }, [shouldShow, inputRef.current]);

  useEffect(() => {
    if (tabQuery.length > 0) {
      setActiveIndex(0);
    }
  }, [tabQuery]);

  if (!shouldShow) return null;
  return (
    <div
      style={{
        all: 'initial',
        width: '100vw',
        height: '100vh',
        left: 0,
        top: 0,
        position: 'fixed',
        zIndex: 100000000,
        display: 'flex',
        justifyContent: 'center',
        backdropFilter: 'blur(4px) brightness(60%)',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <div
        style={{
          borderRadius: '8px',
          border: '1px solid rgba(0,0,0,0.4)',
          backgroundColor: 'rgba(255,255,255,0.8)',
          padding: '8px',
          width: '600px',
          marginTop: '5vh',
        }}
      >
        <div>
          <input
            ref={inputRef}
            onChange={(e) => {
              setTabQuery(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.which === 74 && e.metaKey) {
                setActiveIndex(
                  (currIndex) => (currIndex + 1) % filteredTabs.length
                );
              }
              if (e.which === 38) {
                setActiveIndex((currIndex) => Math.max(currIndex - 1, 0));
              }
              if (e.which === 40) {
                setActiveIndex(
                  (currIndex) => (currIndex + 1) % filteredTabs.length
                );
              }
              if (e.which === 13) {
                switchTab(messagePort.current, filteredTabs[activeIndex].id);
              }
            }}
            autoFocus
            style={{
              width: 'calc(100% - 8px)',
              borderRadius: '16px',
              padding: '4px',
              backgroundColor: 'white',
              border: 'none',
            }}
          />
        </div>
        <div style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          {filteredTabs.map((tab, i) => (
            <TabRow
              active={i === activeIndex}
              favicon={tab.favIconUrl}
              title={tab.title}
              key={tab.id}
              onClick={() => {
                switchTab(messagePort.current, tab.id);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function tabMatchesQuery(tab: Tabs.Tab, query: string) {
  let normalizedQuery = query.toLowerCase();
  return (
    tab.title?.includes(normalizedQuery) || tab.url?.includes(normalizedQuery)
  );
}

function switchTab(port: Runtime.Port, tabId: string): void {
  port.postMessage({
    activateTab: tabId,
  });
}

function TabRow({
  active,
  favicon,
  title,
  onClick,
}: {
  active: boolean;
  favicon: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '40px',
        backgroundColor: active ? 'rgba(0,30,255,0.3)' : '',
        color: 'black',
      }}
      onMouseDown={(e) => {
        onClick();
      }}
    >
      <img src={favicon} width="24px" height="24px" />
      <div
        style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {title}
      </div>
    </div>
  );
}
const root = document.body.appendChild(document.createElement('div'));
const shadowRef = root.attachShadow({ mode: 'closed' });

ReactDOM.render(<Command />, shadowRef);
