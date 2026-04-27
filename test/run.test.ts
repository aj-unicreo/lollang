import { describe, expect, it, vi } from "vitest";
import { run } from "../src/run.js";

describe("run", () => {
  it("evaluates a simple expression", async () => {
    const result = await run("1 + 2");
    expect(result).toBe(3);
  });

  it("evaluates LOL keywords", async () => {
    const result = await run("(haha (n) { rofl n * 2; })(21)");
    expect(result).toBe(42);
  });

  it("calls console.log via xd", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      await run('xd("from-lol")');
      expect(spy).toHaveBeenCalledWith("from-lol");
    } finally {
      spy.mockRestore();
    }
  });

  it("evaluates control flow", async () => {
    const result = await run(`
      lmao xs = [1, 2, 3];
      lol total = 0;
      heh (lol i = 0; i < xs.length; i = i + 1) {
        total = total + xs[i];
      }
      total;
    `);
    expect(result).toBe(6);
  });

  it("propagates thrown errors", async () => {
    await expect(run('ded omegalul Error("boom");')).rejects.toThrow("boom");
  });
});
