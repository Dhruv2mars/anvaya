import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveLocation } from "./location";

const location = vi.hoisted(() => ({
  PermissionStatus: {
    GRANTED: "granted",
    DENIED: "denied",
    UNDETERMINED: "undetermined",
  },
  Accuracy: { Balanced: 3 },
  getForegroundPermissionsAsync: vi.fn(),
  requestForegroundPermissionsAsync: vi.fn(),
  getLastKnownPositionAsync: vi.fn(),
  getCurrentPositionAsync: vi.fn(),
}));

const repository = vi.hoisted(() => ({
  getSetting: vi.fn(),
  setSetting: vi.fn(),
}));

vi.mock("expo-location", () => location);
vi.mock("@/src/db/repository", () => repository);

const permission = (status: string, canAskAgain: boolean) => ({
  status,
  canAskAgain,
  granted: status === "granted",
  expires: "never",
});

beforeEach(() => {
  vi.clearAllMocks();
  repository.getSetting.mockResolvedValue(null);
  repository.setSetting.mockResolvedValue(undefined);
  location.getLastKnownPositionAsync.mockResolvedValue(null);
  location.getCurrentPositionAsync.mockResolvedValue(null);
});

describe("resolveLocation", () => {
  it("does not request a permission Android has permanently blocked", async () => {
    location.getForegroundPermissionsAsync.mockResolvedValue(permission("denied", false));

    const result = await resolveLocation({ requestPermission: true });

    expect(location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
    expect(result.permission).toMatchObject({ status: "denied", canAskAgain: false });
    expect(result.location.source).toBe("default");
  });

  it("shares one native permission request across concurrent refreshes", async () => {
    let resolvePermission!: (value: ReturnType<typeof permission>) => void;
    const pendingPermission = new Promise<ReturnType<typeof permission>>((resolve) => {
      resolvePermission = resolve;
    });
    location.getForegroundPermissionsAsync.mockResolvedValue(
      permission("undetermined", true)
    );
    location.requestForegroundPermissionsAsync.mockReturnValue(pendingPermission);
    location.getLastKnownPositionAsync.mockResolvedValue({
      coords: { latitude: 19.076, longitude: 72.8777, altitude: 14 },
    });

    const first = resolveLocation({ requestPermission: true });
    const second = resolveLocation({ requestPermission: true });
    await vi.waitFor(() =>
      expect(location.requestForegroundPermissionsAsync).toHaveBeenCalled()
    );

    expect(location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);

    resolvePermission(permission("granted", true));
    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(firstResult.location).toEqual(secondResult.location);
    expect(firstResult.location).toMatchObject({
      latitude: 19.076,
      longitude: 72.8777,
      source: "cached",
    });
  });

  it("prefers a current fix for an explicit refresh", async () => {
    location.getForegroundPermissionsAsync.mockResolvedValue(permission("granted", true));
    location.getLastKnownPositionAsync.mockResolvedValue({
      coords: { latitude: 28.6, longitude: 77.2, altitude: 200 },
    });
    location.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 19.076, longitude: 72.8777, altitude: 14 },
    });

    const result = await resolveLocation({ forceCurrent: true });

    expect(location.getCurrentPositionAsync).toHaveBeenCalledTimes(1);
    expect(location.getLastKnownPositionAsync).not.toHaveBeenCalled();
    expect(result.location).toMatchObject({ latitude: 19.076, longitude: 72.8777 });
  });

  it("returns and caches the exact coordinates supplied to Panchang callers", async () => {
    location.getForegroundPermissionsAsync.mockResolvedValue(permission("granted", true));
    location.getLastKnownPositionAsync.mockResolvedValue({
      coords: { latitude: 12.9715987, longitude: 77.5945627, altitude: 920.25 },
    });

    const result = await resolveLocation();

    expect(result.location).toEqual({
      latitude: 12.9715987,
      longitude: 77.5945627,
      altitude: 920.25,
      source: "cached",
    });
    expect(repository.setSetting).toHaveBeenCalledWith(
      "location_cache",
      JSON.stringify(result.location)
    );
  });
});
