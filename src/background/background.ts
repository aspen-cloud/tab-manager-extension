import { browser, Tabs, Runtime } from 'webextension-polyfill-ts';

import 'images/icon-16.png';
import 'images/icon-48.png';
import 'images/icon-128.png';

browser.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    return browser.tabs.create({
      url: browser.runtime.getURL('welcome.html'),
    });
  }
});

const allPorts = new Set<Runtime.Port>();

let recentTabs: Tabs.Tab[] = [];

browser.runtime.onConnect.addListener(async function (port) {
  const tabs = await getOpenTabs();
  port.postMessage({ openTabs: tabs });
  port.postMessage({ recentTabs });
  port.onMessage.addListener((msg) => {
    if (msg.activateTab) {
      browser.tabs.update(msg.activateTab, { active: true });
    }
  });
  allPorts.add(port);
  port.onDisconnect.addListener((port) => {
    allPorts.delete(port);
  });
});

function setRecentTabs(tabs: Tabs.Tab[]) {
  recentTabs = tabs;
  for (const port of allPorts.values()) {
    console.log('sending', recentTabs, 'to', port);
    port.postMessage({
      recentTabs,
    });
  }
}

browser.tabs.onActivated.addListener(async (tabInfo) => {
  const activeTab = await browser.tabs.get(tabInfo.tabId);
  setRecentTabs([
    activeTab,
    ...recentTabs
      .filter((tab) => tab.id !== activeTab.id)
      .map((tab) => ({ ...tab, active: false })),
  ]);
});

browser.tabs.onUpdated.addListener((tabId, tabInfo, tab) => {
  const updatedTabIndex = recentTabs.findIndex(
    (recentTab) => recentTab.id === tab.id
  );
  if (updatedTabIndex > -1) {
    setRecentTabs([...recentTabs].splice(updatedTabIndex, 1, tab));
  }
});

browser.tabs.onRemoved.addListener(async (tabId) => {
  setRecentTabs(recentTabs.filter((tab) => tab.id !== tabId));
});

browser.tabs.onCreated.addListener((tab: Tabs.Tab) => {
  setRecentTabs([tab, ...recentTabs]);
});

async function getOpenTabs() {
  return browser.tabs.query({ currentWindow: true });
}
