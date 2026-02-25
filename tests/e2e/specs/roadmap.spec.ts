import { expect, test } from "@playwright/test";

test("playwright scaffold boots", async () => {
  expect(true).toBeTruthy();
});

const plannedScenarios = [] as const;

for (const scenario of plannedScenarios) {
  test.skip(`${scenario} @planned`, async () => {
    expect(scenario.length).toBeGreaterThan(0);
  });
}
