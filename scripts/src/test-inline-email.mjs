import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH }
    : {}),
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const field = (name) => page.getByTestId(name);
const click = (name) => field(name).click();
const typical = 'Decline Thursday and propose Friday after 3 PM';
const challenge = 'Make it nicer but not too formal and explain that I have a class';
const suggestion = () => field('text-suggestion').innerText();

try {
  await page.goto(process.env.PROTOTYPE_URL || 'http://localhost:80/');
  await field('input-instruction').waitFor();
  assert.match(await field('simulation-notice').innerText(), /not a live AI model/);

  await field('input-instruction').fill(typical);
  await click('button-ai');
  const first = await suggestion();
  assert.match(first, /Thursday at 2 PM doesn't work/);
  assert.match(first, /Friday after 3 PM/);
  await click('button-regenerate');
  const alternate = await suggestion();
  assert.notEqual(alternate, first);
  await click('button-accept');
  assert.equal(await field('input-reply').inputValue(), alternate);
  await field('input-reply').fill(`${alternate}\nMANUAL DRAFT`);
  const savedDraft = await field('input-reply').inputValue();
  await click('button-new-instruction');
  assert.equal(await field('input-instruction').inputValue(), '');
  assert.equal(await field('input-reply').inputValue(), savedDraft);
  console.log('Typical: PASS — decline/Friday reply, alternate wording, accepted editable draft, new instruction without reload preserved draft.');

  await field('input-instruction').fill(challenge);
  await click('button-ai');
  const friendly = await suggestion();
  assert.notEqual(friendly, first);
  assert.match(friendly, /have a class on Thursday at 2 PM/);
  assert.match(friendly, /Friday after 3 PM/);
  assert.match(friendly, /Thanks for reaching out! I'd love to catch up/);
  await click('button-edit');
  const edited = `${friendly}\nMANUAL SUGGESTION`;
  await field('input-suggestion-edit').fill(edited);
  await click('button-regenerate');
  await field('regenerate-warning').waitFor();
  assert.equal(await field('input-suggestion-edit').inputValue(), edited);
  await click('button-keep-edits');
  assert.equal(await field('input-suggestion-edit').inputValue(), edited);
  assert.equal(await field('regenerate-warning').count(), 0);
  await click('button-regenerate');
  await click('button-discard-edits');
  const friendlyAlternate = await suggestion();
  assert.notEqual(friendlyAlternate, friendly);
  assert.match(friendlyAlternate, /class Thursday at 2 PM/);
  await click('button-edit');
  await field('input-suggestion-edit').fill(`${friendlyAlternate}\nCANCEL THIS`);
  await click('button-cancel');
  assert.equal(await field('input-instruction').inputValue(), challenge);
  assert.equal(await field('input-reply').inputValue(), savedDraft);
  await click('button-ai');
  await click('button-edit');
  // Empty edited suggestions cannot be accepted.
  await field('input-suggestion-edit').fill('   ');
  assert.equal(await field('button-accept').isDisabled(), true);
  const acceptedEdits = `${friendly}\nCUSTOM ACCEPTED`;
  await field('input-suggestion-edit').fill(acceptedEdits);
  assert.match(await field('button-accept').innerText(), /replace draft/);
  await click('button-accept');
  assert.equal(await field('input-reply').inputValue(), acceptedEdits);
  await click('button-new-instruction');
  console.log('Challenge: PASS — distinct friendly class-conflict responses, warning preserves edits, both regeneration choices work, Cancel restores instruction and draft, Accept retains edits and explicitly replaces draft.');

  for (const invalid of ['', '   \n\t']) {
    await field('input-instruction').fill(invalid);
    await click('button-ai');
    await field('text-error').waitFor();
    assert.match(await field('text-error').innerText(), /Enter an instruction first/);
    assert.equal(await field('panel-suggestion').count(), 0);
    assert.equal(await field('input-instruction').getAttribute('aria-invalid'), 'true');
    assert.equal(await field('input-reply').inputValue(), acceptedEdits);
  }
  await field('input-instruction').fill(typical);
  assert.equal(await field('text-error').count(), 0);
  await click('button-ai');
  await field('panel-suggestion').waitFor();
  await click('button-cancel');
  console.log('Invalid / empty: PASS — empty and whitespace-only inputs show validation, never advance, preserve draft; valid retry clears error and works.');

  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  const inputBox = await field('input-instruction').boundingBox();
  const buttonBox = await field('button-ai').boundingBox();
  assert(inputBox && buttonBox);
  assert(buttonBox.x >= inputBox.x && buttonBox.x + buttonBox.width <= inputBox.x + inputBox.width + 1);
  assert(buttonBox.y >= inputBox.y && buttonBox.y + buttonBox.height <= inputBox.y + inputBox.height + 1);
  assert.deepEqual(errors, []);
  console.log('Additional checks: PASS — phone has no horizontal overflow, AI action is inside field bounds, simulation is explicit, no uncaught browser errors.');
} finally {
  await browser.close();
}
