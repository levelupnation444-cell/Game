import React, { useState, useEffect } from "react";
import { api } from "../api";
import type { ForumPost, ForumComment } from "../api";

export const ForumSection: React.FC = () => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [posting, setPosting] = useState(false);

  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [activePostData, setActivePostData] = useState<{ post: ForumPost; comments: ForumComment[] } | null>(null);
  const [postLoading, setPostLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);

  const fetchPosts = async () => {
    try {
      const res = await api.forum.getPosts();
      setPosts(res.posts);
    } catch (e) {
      console.error("Failed to load forum posts", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    setPosting(true);
    try {
      await api.forum.createPost(newTitle.trim(), newContent.trim());
      setNewTitle("");
      setNewContent("");
      setShowNewPostForm(false);
      await fetchPosts();
    } catch (e) {
      console.error("Failed to create post", e);
    } finally {
      setPosting(false);
    }
  };

  const handleOpenPost = async (id: string) => {
    setActivePostId(id);
    setPostLoading(true);
    try {
      const data = await api.forum.getPost(id);
      setActivePostData(data);
    } catch (e) {
      console.error("Failed to fetch post details", e);
    } finally {
      setPostLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePostId || !commentText.trim()) return;
    setCommenting(true);
    try {
      const res = await api.forum.addComment(activePostId, commentText.trim());
      setActivePostData((prev) =>
        prev
          ? {
              ...prev,
              comments: [...prev.comments, res.comment],
              post: { ...prev.post, commentsCount: Number(prev.post.commentsCount || 0) + 1 },
            }
          : null
      );
      setCommentText("");
      fetchPosts();
    } catch (e) {
      console.error("Failed to add comment", e);
    } finally {
      setCommenting(false);
    }
  };

  return (
    <div className="card" style={{ marginTop: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <span className="tag blue">Community</span>
          <h2 className="headline" style={{ fontSize: "18px", marginTop: "6px" }}>Pathfinder Forum</h2>
        </div>
        {!showNewPostForm && !activePostId && (
          <button className="btn small" onClick={() => setShowNewPostForm(true)}>
            + New Post
          </button>
        )}
      </div>

      {/* Expanded Single Post View */}
      {activePostId ? (
        <div>
          <button
            className="btn small ghost"
            style={{ marginBottom: "16px" }}
            onClick={() => {
              setActivePostId(null);
              setActivePostData(null);
            }}
          >
            ← Back to Posts
          </button>

          {postLoading || !activePostData ? (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--text-3)" }}>Loading post...</div>
          ) : (
            <div>
              <div style={{ borderBottom: "2px solid var(--border)", paddingBottom: "16px", marginBottom: "16px" }}>
                <h3 className="headline" style={{ fontSize: "20px", color: "var(--blue)", marginBottom: "8px" }}>
                  {activePostData.post.title}
                </h3>
                <div style={{ fontSize: "12px", color: "var(--text-3)", marginBottom: "12px" }}>
                  Posted by <strong style={{ color: "var(--text-1)" }}>{activePostData.post.userName}</strong> ({activePostData.post.userClass})
                </div>
                <p style={{ color: "var(--text-1)", fontSize: "16px", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {activePostData.post.content}
                </p>
              </div>

              {/* Comments */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                <h4 className="headline" style={{ fontSize: "14px", color: "var(--text-2)" }}>
                  Comments ({activePostData.comments.length})
                </h4>
                {activePostData.comments.length === 0 ? (
                  <div style={{ fontSize: "14px", color: "var(--text-3)", fontStyle: "italic" }}>
                    No comments yet. Be the first to reply!
                  </div>
                ) : (
                  activePostData.comments.map((c) => (
                    <div key={c.id} style={{ background: "var(--surface-2)", border: "2px solid var(--border)", padding: "12px" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-3)", marginBottom: "6px" }}>
                        <strong style={{ color: "var(--text-1)" }}>{c.userName}</strong> ({c.userClass})
                      </div>
                      <div style={{ fontSize: "15px", color: "var(--text-1)", lineHeight: 1.5 }}>
                        {c.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment */}
              <form onSubmit={handleAddComment} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <textarea
                  rows={2}
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={commenting}
                />
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn small green" type="submit" disabled={commenting || !commentText.trim()}>
                    {commenting ? "Posting..." : "Reply"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      ) : showNewPostForm ? (
        /* Create New Post Form */
        <form onSubmit={handleCreatePost} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label className="form-label">Title</label>
            <input
              type="text"
              placeholder="What's on your mind?"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              disabled={posting}
              required
            />
          </div>
          <div>
            <label className="form-label">Message</label>
            <textarea
              rows={4}
              placeholder="Share a win, prayer request, or question..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              disabled={posting}
              required
            />
          </div>
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button type="button" className="btn small ghost" onClick={() => setShowNewPostForm(false)} disabled={posting}>
              Cancel
            </button>
            <button type="submit" className="btn small green" disabled={posting || !newTitle.trim() || !newContent.trim()}>
              {posting ? "Publishing..." : "Post"}
            </button>
          </div>
        </form>
      ) : (
        /* Forum Posts List */
        <div>
          {loading ? (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--text-3)" }}>Loading discussions...</div>
          ) : posts.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--text-3)" }}>
              No discussions yet. Start one!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => handleOpenPost(post.id)}
                  style={{
                    background: "var(--surface-2)",
                    border: "2px solid var(--border)",
                    padding: "14px",
                    cursor: "pointer",
                    transition: "border-color 150ms",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--blue)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  <h3 className="headline" style={{ fontSize: "15px", color: "var(--text-1)", marginBottom: "4px" }}>
                    {post.title}
                  </h3>
                  <p style={{ color: "var(--text-2)", fontSize: "14px", margin: "0 0 10px", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {post.content}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--text-3)" }}>
                    <span>
                      by <strong style={{ color: "var(--text-1)" }}>{post.userName}</strong> ({post.userClass})
                    </span>
                    <span style={{ fontWeight: "700" }}>💬 {post.commentsCount || 0} comments</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
