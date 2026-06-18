import { collectReferenceSnapshots } from './collect-reference-snapshots.js';

export default class ReferenceSnapshotReporter {
  onBegin() {
    this.failed = false;
  }

  onTestEnd(_test, result) {
    if (result.status !== 'passed' && result.status !== 'skipped') {
      this.failed = true;
    }
  }

  onEnd() {
    if (!this.failed) return;
    console.log('\nCollecting reference snapshots from failed visual tests...\n');
    const copied = collectReferenceSnapshots();
    if (copied === 0) {
      console.warn('No reference snapshots were collected (missing test-results/*-actual.png).');
    }
  }
}
