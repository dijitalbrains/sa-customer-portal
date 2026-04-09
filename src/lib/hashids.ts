import Hashids from "hashids";

const hashids = new Hashids(process.env.HASHIDS_SALT!);

const HashidsService = {
  encode(ids: number[]): string {
    return hashids.encode(ids);
  },

  decode(encoded: string): number[] {
    return hashids.decode(encoded) as number[];
  },
};

export default HashidsService;
