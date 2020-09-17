import { browser, Tabs } from 'webextension-polyfill-ts';
import React, { useEffect, useState } from 'react';
import './Popup.scss';
import { LayoutSplit, XCircle, Search, Circle } from 'react-bootstrap-icons';

async function splitTab(tabId: number) {
  const currentWindow = await browser.windows.getCurrent();
  if (!currentWindow.id) {
    return;
  }
  const halfWidth = window.screen.width / 2;
  browser.windows.update(currentWindow.id, { width: halfWidth, left: 0 });
  return await browser.windows.create({
    width: halfWidth,
    left: halfWidth,
    tabId,
  });
}

async function closeTab(tabId: number) {
  return browser.tabs.remove(tabId);
}

async function showTab(tabId: number) {
  return browser.tabs.update(tabId, { active: true });
}

const tabChangeEvents = [
  browser.tabs.onCreated,
  browser.tabs.onRemoved,
  browser.tabs.onDetached,
  browser.tabs.onMoved,
];

function Popup() {
  const [activeTab, setActiveTab] = useState<Tabs.Tab>();
  const [allTabs, setAllTabs] = useState<Tabs.Tab[]>([]);
  const [recentTabs, setRecentTabs] = useState<Tabs.Tab[]>([]);
  const [tabQuery, setTabQuery] = useState('');

  function updateAllTabs() {
    browser.tabs.query({ currentWindow: true }).then((tabs) => {
      setAllTabs(tabs.reverse());
    });
  }

  useEffect(() => {
    browser.tabs
      .query({ active: true, currentWindow: true })
      .then((matchingTabs) => {
        if (matchingTabs.length === 0) {
          return;
        }
        const [tab] = matchingTabs;
        setActiveTab(tab);
      });

    updateAllTabs();

    tabChangeEvents.forEach((tabChange) => {
      tabChange.addListener(updateAllTabs);
    });

    const port = browser.runtime.connect();
    port.onMessage.addListener((msg) => {
      if (msg.recentTabs) {
        setRecentTabs(msg.recentTabs);
      }
    });
    return () => {
      port.disconnect();
      tabChangeEvents.forEach((tabChange) => {
        tabChange.removeListener(updateAllTabs);
      });
    };
  }, []);

  return (
    <div className="Popup p-3">
      <h5 className="text-center">
        <b>Tab Manager</b> by Aspen
      </h5>
      <SectionTitle title="Current Tab" />
      {activeTab ? <TabRow tab={activeTab} /> : null}
      <hr />
      <div className="input-group input-group-sm mb-3 mt-3">
        <div className="input-group-prepend">
          <div className="input-group-text">
            <Search />
          </div>
        </div>
        <input
          placeholder={'Search for a tab'}
          autoFocus
          className="flex-grow-1 form-control"
          onChange={(e) => setTabQuery(e.target.value)}
        />
      </div>
      <div className="mb-3">
        <SectionTitle title="Recent Tabs" />
        <div>
          {recentTabs
            .filter((tab) => !tab.active && tabMatchesQuery(tab, tabQuery))
            .map((tab) => (
              <TabRow tab={tab} />
            ))}
        </div>
      </div>
      <div className="mb-3">
        <SectionTitle title="All tabs" />
        <div>
          {allTabs
            .filter((tab) => tabMatchesQuery(tab, tabQuery))
            .map((tab) => (
              <TabRow tab={tab} />
            ))}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="d-flex align-items-center">
      <h6>{title}</h6>
      <div className="bg-light flex-grow-1 h6 ml-1" style={{ height: '1px' }} />
    </div>
  );
}

function TabRow({ tab }: { tab: Tabs.Tab }) {
  return (
    <div className="mb-1 d-flex btn-group btn-group-sm">
      <button
        disabled={tab.active}
        onClick={() => {
          if (!tab.id) {
            return;
          }
          showTab(tab.id);
        }}
        className="btn btn-outline-primary text-left flex-grow-1 text-nowrap d-flex align-items-center overflow-hidden"
        title={`Switch to ${tab.title}`}
      >
        {tab.favIconUrl ? (
          <img
            className="mr-2"
            width="24px"
            height="24px"
            src={tab.favIconUrl}
          />
        ) : (
          <Circle className="mr-2" size="24" />
        )}
        <span className="text-nowrap text-truncate">{tab.title}</span>
      </button>
      <button
        className="btn flex-grow-0 btn-outline-info d-flex justify-content-center align-items-center"
        onClick={() => {
          if (!tab.id) {
            return;
          }
          splitTab(tab.id);
        }}
        title="Move tab to split window"
      >
        <LayoutSplit />
      </button>
      <button
        className="btn flex-grow-0 btn-outline-danger d-flex justify-content-center align-items-center"
        onClick={() => {
          if (!tab.id) {
            return;
          }
          closeTab(tab.id);
        }}
        title="Close tab"
      >
        <XCircle />
      </button>
    </div>
  );
}

function tabMatchesQuery(tab: Tabs.Tab, query: string) {
  if (query === '') {
    return true;
  }
  let normalizedQuery = query.toLowerCase();
  return (
    tab.title?.includes(normalizedQuery) || tab.url?.includes(normalizedQuery)
  );
}

export default Popup;
