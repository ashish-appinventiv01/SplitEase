import { createGroupSchema } from "./create-group.dto";
import { addMemberSchema } from "./add-member.dto";
import { updateGroupSchema } from "./update-group.dto";
import {
  groupIdParamSchema,
  removeMemberParamSchema,
  paginationQuerySchema,
} from "./group-id.dto";

export class GroupValidation {
  public static readonly createGroup = createGroupSchema;
  public static readonly addMember = addMemberSchema;
  public static readonly updateGroup = updateGroupSchema;
  public static readonly groupIdParam = groupIdParamSchema;
  public static readonly removeMemberParam = removeMemberParamSchema;
  public static readonly paginationQuery = paginationQuerySchema;
}