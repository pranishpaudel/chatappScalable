import prismaClientForChat from "../prisma/client";

export async function getGroupMembers(groupId: string): Promise<string[]> {
  const group = await prismaClientForChat.group.findUnique({
    where: {
      id: groupId,
    },
    select: {
      members: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!group) {
    throw new Error("Group not found");
  }

  return group.members.map((member: any) => member.id);
}
