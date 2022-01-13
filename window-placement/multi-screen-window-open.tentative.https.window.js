// META: global=window
// META: script=/resources/testdriver.js
// META: script=/resources/testdriver-vendor.js
'use strict';

promise_test(async t => {
  await test_driver.set_permission({name: 'window-placement'}, 'granted');
  const screenDetails = await self.getScreenDetails();
  // Note: content_shell currently does not supply multi-screen details.
  assert_greater_than(screenDetails.screens.length, 0);
  for (let s of screenDetails.screens) {
    const targetLeft = s.availLeft + s.availWidth/2 - 150;
    const targetTop = s.availTop + s.availHeight/2 - 50;
    const popupWindow = window.open(window.location, '', `left=${targetLeft},top=${targetTop},width=300,height=100`);
    // Check the placement, initial `screenLeft` and `screenTop` values before the document loads should be equal.
    assert_equals(popupWindow.screenLeft, targetLeft);
    assert_equals(popupWindow.screenTop, targetTop);

    // Wait for window.screenTop|screenLeft values to be resolved after the window frame is created.
    // Window.open()'s `top` and `left` feature string parameters represent the origin of the child popup window.
    // Window.open() synchronously returns a Window object with estimated screenTop|screenLeft values.
    // The child window's screenTop|screenLeft values are updated during asynchronous window creation and clamped placement.
    await new Promise(resolve => { popupWindow.onload = resolve; });
    await new Promise(resolve => { step_timeout(resolve, 300); });

    // Window.screenTop|screenLeft may represent the origin of the child popup window's web content viewport, inset by the window's frame.
    // These values may also be zero, if the user agent wishes to hide information about the screen of the output device.
    // Also, content_shell does not currently support the placement of popup windows.
    // As needed, roughly estimate the window's resolved coordinates by subtracting the difference of the window's inner and outer sizes.
    let tolerance = 10;
    let estimatedWindowLeft = popupWindow.screenTop - (popupWindow.outerWidth - popupWindow.innerWidth) / 2;
    let estimatedWindowTop = popupWindow.screenTop - (popupWindow.outerHeight - popupWindow.innerHeight);
    assert_true((popupWindow.screenLeft == 0) ||
                (popupWindow.screenLeft == targetLeft) ||
                (Math.abs(estimatedWindowLeft - targetLeft) <= tolerance));
    assert_true((popupWindow.screenTop == 0) ||
                (popupWindow.screenTop == targetTop) ||
                (Math.abs(estimatedWindowTop - targetTop) <= tolerance));
  }
}, 'Use ScreenDetails to open a popup window on each screen');