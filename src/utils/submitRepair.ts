export type RepairFormData = {
  fullName: string;
  deptName: string;
  deptBuilding: string;
  deptFloor: string;
  device: string;
  deviceId: string;
  issue: string;
  phone: string;
};

export interface SubmitResponse {
  ok: boolean;
  jobId?: string;
  error?: string;
  dbSaved?: boolean;
  pushSent?: boolean;
  notifySent?: boolean;
}

export async function submitRepairForm(data: RepairFormData): Promise<SubmitResponse> {
  try {
    const response = await fetch("/api/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result: SubmitResponse = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: result.error || "Failed to submit repair request",
      };
    }

    return {
      ok: true,
      jobId: result.jobId,
      dbSaved: result.dbSaved,
      pushSent: result.pushSent,
      notifySent: result.notifySent,
    };
  } catch (error) {
    console.error("Submit error:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}