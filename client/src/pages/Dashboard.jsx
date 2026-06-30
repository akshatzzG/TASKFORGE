import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Folder, Sparkles } from 'lucide-react';
import { getProjects } from '../api/projects';
import Layout from '../components/layout';
import CreateProjectModal from '../components/createProjectModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await getProjects();
      setProjects(res.data.data.projects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreated = (project) => {
    setProjects([{ ...project, taskCount: 0, completedCount: 0, progress: 0 }, ...projects]);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Projects</h1>
            <p className="text-text-secondary text-sm mt-1">Manage your team's work</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-violet-500 hover:bg-violet-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            New project
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface border border-border-base rounded-2xl p-5 h-36 animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-border-light rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
              <Folder className="w-6 h-6 text-violet-400" />
            </div>
            <p className="text-text-primary font-medium mb-1">Start your first project</p>
            <p className="text-text-secondary text-sm mb-5">Create a project to start organizing tasks with AI</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-violet-500 hover:bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
            >
              Create project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project, i) => (
              <div
                key={project._id}
                onClick={() => navigate(`/project/${project._id}`)}
                style={{ animationDelay: `${i * 40}ms` }}
                className="group bg-surface border border-border-base rounded-2xl p-5 cursor-pointer hover:border-border-light hover:-translate-y-0.5 transition-all animate-fade-in-up"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                  <h3 className="font-medium text-text-primary truncate">{project.name}</h3>
                </div>
                {project.description && (
                  <p className="text-sm text-text-secondary mb-4 line-clamp-2">{project.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-text-muted mb-2">
                  <span>{project.completedCount}/{project.taskCount} tasks done</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="w-full bg-surface-2 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${project.progress}%`, backgroundColor: project.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <CreateProjectModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
    </Layout>
  );
}