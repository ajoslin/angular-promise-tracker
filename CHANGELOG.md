
# Version 1.1 (Apr 9, 2013)

## Features

**Add `cancel` method for a tracker**

  - When called, `myTracker.cancel()` will immediately turn the tracker inactive and fire all events.

**Add a concept of options for trackers**

  - Options can be set when the tracker is first created:

    `var myTracker = promiseTracker('super_track', { stressLevel: 0 });`

  - All options also have setters:

    `myTracker.setStressLevel(0);`

**Add `minDuration` option**

  - Passed in with `minDuration` key in options, or set with `setMinDuration` method on a tracker.
  - Makes it so when a tracker is activated, it will always stay up for at least the given milliseconds.
  - For example, if I set minDuration to 1000 and give my tracker three promises that all resolve after 850ms, the tracker will stay active until 1000ms have expired.

**Add `maxDuration` option**

  - Passed in with `maxDuration` key in options, or set with `setMaxDuration` method on a tracker.
  - Makes it so a tracker will automatically deactivate itself after the given milliseconds of being active.
  - For example, if I set maxDuration to 5000, no matter how long the promises I give my tracker wait to be resolved, the tracker will deactivate after 5000ms have expired.
