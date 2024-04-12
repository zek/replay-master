import { TableBuilder } from "../../../services/discord/views/table";

interface TableRow {
  round: string;
  kills: string;
  details: string;
}

describe("Test 'table' view", () => {

  test("should return with table", async () => {
    const tableBuilder = new TableBuilder<TableRow>([
      { index: 0, label: "Round", width: 8, field: "round" },
      { index: 1, label: "Kills", width: 29, field: "kills" },
      { index: 2, label: "Details", width: 29, field: "details" },
    ]);

    tableBuilder.addRows({
      round: "R2",
      kills: "deagle, deagle, deagle",
      details: "SnipersNest, SnipersNest, BombsiteA",
    });

    expect(tableBuilder.build()).toBe("`Round   Kills                        Details                      \n――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――\nR2      deagle, deagle, deagle       SnipersNest, SnipersNest, BombsiteA`");

  });

});
