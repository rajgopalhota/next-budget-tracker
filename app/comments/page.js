"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { CommentOutlined } from "@ant-design/icons";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import NewCommentBox from "@/components/Comments/NewCommentBox";
import CommentBox from "@/components/Comments/CommentBox";
import { Button, Spin, message } from "antd";

export default function CommentsPage() {
  const [comments, setComments] = useState([]);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [newComment, setNewComment] = useState("");
  const { status } = useSession();
  const router = useRouter();
  const loaderRef = useRef(null);

  const fetchComments = async (parentId = null, skipVal = 0, limit = 5) => {
    const params = new URLSearchParams({
      parentId: parentId || "",
      skip: skipVal.toString(),
      limit: limit.toString(),
    });
    const res = await fetch(`/api/comments?${params.toString()}`);
    return await res.json();
  };

  const resetAndFetch = useCallback(async () => {
    setLoading(true);
    setSkip(0);
    const data = await fetchComments(null, 0, 5);
    setComments(data);
    setHasMore(data.length === 5);
    setLoading(false);
  }, []);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const data = await fetchComments(null, skip, 5);
    const newData = data.filter((d) => !comments.some((c) => c._id === d._id));
    setComments((prev) => [...prev, ...newData]);
    setSkip((prev) => prev + 5);
    setHasMore(data.length === 5);
    setLoading(false);
  };

  const handlePost = async () => {
    if (!newComment.trim()) return;
    await fetch("/api/comments", {
      method: "POST",
      body: JSON.stringify({ text: newComment }),
    });
    setNewComment("");
    await resetAndFetch();
  };

  const deleteComment = async (commentId) => {
    try {
      const response = await fetch("/api/comments", {
        method: "DELETE",
        body: JSON.stringify({ commentId }),
      });
      if (response?.status === 200) {
        message.success("Comment deleted successfully");
      }
      await resetAndFetch();
    } catch (error) {
      message.error("Error deleting comment");
      console.error("Error deleting comment:", error);
    }
  };

  const postReply = async (text, parentId) => {
    const res = await fetch("/api/comments", {
      method: "POST",
      body: JSON.stringify({ text, parentId }),
    });
    return await res.json();
  };

  useEffect(() => {
    resetAndFetch();
  }, [resetAndFetch]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [loaderRef, loadMore, loading, hasMore]);

  // Pull to refresh logo effect
  useEffect(() => {
    let startY = 0;
    let dragging = false;
    const threshold = 80;

    const dragger = document.createElement("div");
    dragger.className = "refresh-dragger";

    const logo = document.createElement("img");
    logo.src = "/logo.png";
    logo.alt = "Logo";
    logo.className = "refresh-logo";

    const refreshText = document.createElement("div");
    refreshText.className = "refresh-text";
    refreshText.textContent = "Pull down to refresh";

    dragger.appendChild(logo);
    dragger.appendChild(refreshText);

    document.body.appendChild(dragger);

    const onTouchStart = (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        dragging = true;
      }
    };

    const onTouchMove = (e) => {
      if (!dragging) return;
      const currentY = e.touches[0].clientY;
      const distance = currentY - startY;
      if (distance > 0) {
        dragger.style.height = `${Math.min(distance, threshold * 1.5)}px`;
        refreshText.textContent =
          distance > threshold ? "Release to refresh" : "Pull down to refresh";
      }
    };

    const onTouchEnd = () => {
      if (!dragging) return;
      if (parseInt(dragger.style.height) > threshold) {
        dragger.innerHTML = `<img src="/logo.png" alt="Refreshing..." class="refresh-logo spin" />`;
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        dragger.style.height = "0px";
      }
      dragging = false;
    };

    window.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);

      if (document.body.contains(dragger)) {
        document.body.removeChild(dragger);
      }
    };
  }, []);

  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-xl lg:text-3xl font-bold text-blue-300 text-center flex items-center justify-center gap-2">
        <CommentOutlined />
        <span className="gradient-text-header">Threads & Talks</span>
      </h1>

      <NewCommentBox
        newComment={newComment}
        setNewComment={setNewComment}
        onPost={handlePost}
      />

      {comments.length === 0 && !loading && (
        <div className="text-center text-gray-500">No comments yet.</div>
      )}

      {comments.map((comment) => (
        <CommentBox
          key={comment._id}
          comment={comment}
          fetchReplies={fetchComments}
          postReply={postReply}
          deleteComment={deleteComment}
        />
      ))}

      {loading && (
        <div className="text-center mt-4">
          <Spin />
        </div>
      )}

      <div ref={loaderRef} className="text-center mt-4">
        {hasMore && !loading && <Button onClick={loadMore}>Load More</Button>}
        {!hasMore && !loading && (
          <div className="text-center text-gray-500">
            No more comments to load
          </div>
        )}
      </div>
    </div>
  );
}
