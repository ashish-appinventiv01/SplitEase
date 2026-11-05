import { createGroupSchema } from "./create-group.dto";
import { addMemberSchema } from "./add-member.dto";

export class GroupValidation {
  public static readonly createGroup = createGroupSchema;
  public static readonly addMember = addMemberSchema;
}