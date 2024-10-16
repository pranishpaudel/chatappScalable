"use client";

import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAtom } from "jotai";
import jotaiAtoms from "@/helpers/stateManagement/atom.jotai";
import { Info, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import DCInputForm from "./DCInputForm"; // Adjust the import path accordingly
import { GET_GROUP_MEMBERS } from "@/constants/routes";

const ChatNavArea: React.FC = () => {
  const [currentChatFriend] = useAtom(jotaiAtoms.currentChatFriend);
  const [currentGroup] = useAtom(jotaiAtoms.currentGroup);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [groupMembers, setGroupMembers] = useAtom(jotaiAtoms.groupMembers);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetchedMembers, setHasFetchedMembers] = useState(false);
  const [isDCInputFormVisible, setIsDCInputFormVisible] = useState(false); // New state for DCInputForm visibility

  useEffect(() => {
    if (currentGroup.isSet && currentGroup.id && !hasFetchedMembers) {
      setIsLoading(true);
      fetch(GET_GROUP_MEMBERS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ groupId: currentGroup.id }),
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          throw new Error("Failed to fetch group members");
        })
        .then((data) => {
          setGroupMembers(data.data.members);
          setHasFetchedMembers(true);
        })
        .catch((error) => {
          console.error("Error fetching group members:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [currentGroup.isSet, currentGroup.id, hasFetchedMembers, setGroupMembers]);

  useEffect(() => {
    setHasFetchedMembers(false);
  }, [currentGroup.id]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handlePlusClick = () => {
    setIsDCInputFormVisible(true);
  };

  const handleCloseDCInputForm = () => {
    setIsDCInputFormVisible(false);
  };

  const renderContent = () => {
    if (currentChatFriend.isSet) {
      return (
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage
              src={
                currentChatFriend.image
                  ? currentChatFriend.image
                  : "https://github.com/shadcn.png"
              }
              alt="@shadcn"
            />
            <AvatarFallback>
              {`${currentChatFriend.firstName.charAt(
                0
              )}${currentChatFriend.lastName.charAt(0)}`}
            </AvatarFallback>
          </Avatar>
          <span className="text-lg font-semibold">
            {currentChatFriend.firstName} {currentChatFriend.lastName}
          </span>
        </div>
      );
    } else if (currentGroup.isSet) {
      return (
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={"https://github.com/shadcn.png"} alt="@group" />
            <AvatarFallback>{currentGroup.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="text-lg font-semibold">{currentGroup.name}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      <div className="flex-grow flex items-center justify-between px-7 relative">
        {renderContent()}

        {currentGroup.isSet && (
          <Info className="ml-auto cursor-pointer" onClick={toggleMenu} />
        )}

        {isMenuOpen && (
          <div className="absolute right-0 top-full mt-2 z-10 dropdown-menu-adjust">
            <ScrollArea className="h-72 w-48 rounded-md border border-gray-700 bg-gray-800">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium leading-none text-gray-300">
                    Group Members
                  </h4>
                  <Plus className="cursor-pointer" onClick={handlePlusClick} />
                </div>
                {isLoading ? (
                  <>
                    <Skeleton className="h-6 w-full mb-2 bg-zinc-700" />
                    <Skeleton className="h-6 w-full mb-2 bg-zinc-700" />
                    <Skeleton className="h-6 w-full mb-2 bg-zinc-700" />
                  </>
                ) : (
                  groupMembers.map((member) => (
                    <React.Fragment key={member.id}>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={member.image}
                            alt={`@${member.firstName}`}
                          />
                          <AvatarFallback>
                            {`${member.firstName.charAt(
                              0
                            )}${member.lastName.charAt(0)}`}
                          </AvatarFallback>
                        </Avatar>
                        <span>{`${member.firstName} ${member.lastName}`}</span>
                      </div>
                      <Separator className="my-2 bg-gray-700" />
                    </React.Fragment>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
      <Separator className="w-full bg-gray-700" />
      {isDCInputFormVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
          <DCInputForm
            onClose={handleCloseDCInputForm}
            compType="addMemberInGroup"
            groupId={currentGroup.id}
          />
        </div>
      )}
    </div>
  );
};

export default ChatNavArea;
